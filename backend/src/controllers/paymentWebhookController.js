const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const { triggerAutomation } = require('../services/automationEngine');

// Constant-time comparison for webhook signatures.
const verifyRazorpaySignature = (bodyString, signature, secret) => {
  if (!signature || !secret) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex');
  const received = Buffer.from(String(signature), 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

// @desc    Handle Razorpay inbound webhook
// @route   POST /api/webhooks/razorpay
// @access  Public (Signature Verified)
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
      return res.status(503).json({ success: false, message: 'Webhook secret not configured' });
    }

    // Use the exact bytes Razorpay signed. Re-serializing req.body breaks the HMAC.
    const rawBody = req.rawBody
      ? req.rawBody.toString('utf8')
      : JSON.stringify(req.body);
    const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid signature rejected');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity || {};
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const notes = paymentEntity.notes || {};
      const paidAmount = Number(paymentEntity.amount);
      const currency = String(paymentEntity.currency || '').toUpperCase();

      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        console.warn('[Razorpay Webhook] Captured event is missing a valid amount');
        return res.status(400).json({
          success: false,
          message: 'Webhook payment amount is missing or invalid',
        });
      }
      if (currency && currency !== 'INR') {
        console.warn(`[Razorpay Webhook] Unsupported currency: ${currency}`);
        return res.status(400).json({
          success: false,
          message: 'Webhook payment currency is not supported',
        });
      }

      // Order numbers are unique per tenant, not globally. Honor a businessId in
      // the notes when present, and refuse to act on an ambiguous number.
      let order = null;
      if (orderId) {
        order = await Order.findOne({ 'paymentDetails.razorpayOrderId': orderId });
      }
      if (!order && notes.orderNumber) {
        const orderQuery = { orderNumber: notes.orderNumber };
        if (notes.businessId && mongoose.Types.ObjectId.isValid(notes.businessId)) {
          orderQuery.businessId = notes.businessId;
        }
        const matches = await Order.find(orderQuery).limit(2);
        if (matches.length === 1) {
          order = matches[0];
        } else if (matches.length > 1) {
          console.warn(
            `[Razorpay Webhook] Refusing ambiguous order number: ${notes.orderNumber}`
          );
        }
      }

      if (order && !['PAID', 'REFUNDED'].includes(order.paymentStatus)) {
        const expectedAmount = Math.round(Number(order.totalAmount) * 100);
        if (paidAmount !== expectedAmount) {
          console.warn(
            `[Razorpay Webhook] Amount mismatch for order ${order.orderNumber}: paid ${paidAmount}, expected ${expectedAmount}`
          );
          return res.status(400).json({
            success: false,
            message: 'Payment amount does not match the order total',
          });
        }

        if (order.orderStatus === 'CANCELLED') {
          // Never silently reopen a cancelled order: its stock was already
          // restored and the customer may have been told it was cancelled.
          // Record the captured payment for manual refund/fulfilment review.
          const claimed = await Order.findOneAndUpdate(
            {
              _id: order._id,
              paymentStatus: { $nin: ['PAID', 'REFUNDED'] },
            },
            {
              $set: {
                paymentStatus: 'PAID',
                'paymentDetails.razorpayPaymentId': paymentId || '',
              },
              $push: {
                timeline: {
                  status: 'CANCELLED',
                  note: `Payment captured after cancellation via Razorpay (${paymentId || 'Captured'}). Manual refund or re-fulfilment review required; order was not reopened.`,
                  updatedBy: 'Razorpay Webhook',
                  timestamp: new Date(),
                },
              },
            },
            { new: true }
          );
          if (!claimed) {
            console.log(
              `[Razorpay Webhook] Order ${order.orderNumber} was already updated by a concurrent webhook`
            );
          }
        } else {
          // Atomically claim the transition so two concurrent deliveries of the
          // same event cannot both run confirmation automations.
          const claimed = await Order.findOneAndUpdate(
            {
              _id: order._id,
              paymentStatus: { $nin: ['PAID', 'REFUNDED'] },
              orderStatus: { $ne: 'CANCELLED' },
            },
            {
              $set: {
                paymentStatus: 'PAID',
                orderStatus: 'CONFIRMED',
                'paymentDetails.razorpayPaymentId': paymentId || '',
              },
              $push: {
                timeline: {
                  status: 'CONFIRMED',
                  note: `Payment verified via Razorpay (${paymentId || 'Captured'})`,
                  updatedBy: 'Razorpay Webhook',
                  timestamp: new Date(),
                },
              },
            },
            { new: true }
          );

          if (!claimed) {
            console.log(
              `[Razorpay Webhook] Order ${order.orderNumber} was already processed by a concurrent webhook`
            );
          } else {
            // Fire trigger only for the request that actually won the transition.
            await triggerAutomation({
              businessId: claimed.businessId,
              trigger: 'ORDER_CONFIRMED',
              entityType: 'ORDER',
              entityId: claimed._id.toString(),
              data: {
                orderNumber: claimed.orderNumber,
                customerName: claimed.customerName,
                totalAmount: claimed.totalAmount,
                paymentStatus: 'PAID',
              },
            });
          }
        }
      } else if (order) {
        console.log(
          `[Razorpay Webhook] Order ${order.orderNumber} is already ${order.paymentStatus.toLowerCase()}; ignoring replay`
        );
      }

      // Check if it's a Booking advance payment
      if (notes.bookingNumber) {
        const bookingQuery = { bookingNumber: notes.bookingNumber };
        if (notes.businessId && mongoose.Types.ObjectId.isValid(notes.businessId)) {
          bookingQuery.businessId = notes.businessId;
        }
        const bookingMatches = await Booking.find(bookingQuery).limit(2);
        const booking = bookingMatches.length === 1 ? bookingMatches[0] : null;
        if (bookingMatches.length > 1) {
          console.warn(
            `[Razorpay Webhook] Refusing ambiguous booking number: ${notes.bookingNumber}`
          );
        }

        if (booking && booking.paymentStatus !== 'PAID') {
          const expectedAdvance = Math.round(
            Number(
              booking.expectedAdvance ||
                (Number(booking.totalAmount) * Number(booking.advanceTokenPercent || 20)) / 100
            ) * 100
          );
          if (expectedAdvance > 0 && paidAmount !== expectedAdvance) {
            console.warn(
              `[Razorpay Webhook] Advance mismatch for booking ${booking.bookingNumber}: paid ${paidAmount}, expected ${expectedAdvance}`
            );
            return res.status(400).json({
              success: false,
              message: 'Payment amount does not match the booking advance',
            });
          }

          if (booking.bookingStatus === 'CANCELLED') {
            const claimed = await Booking.findOneAndUpdate(
              { _id: booking._id, paymentStatus: { $ne: 'PAID' } },
              {
                $push: {
                  timeline: {
                    status: 'CANCELLED',
                    note: `Advance captured after cancellation via Razorpay (${paymentId}). Manual refund required; booking was not reopened.`,
                    updatedBy: 'Razorpay Webhook',
                    timestamp: new Date(),
                  },
                },
              },
              { new: true }
            );
            if (!claimed) {
              console.log(
                `[Razorpay Webhook] Booking ${booking.bookingNumber} was already updated by a concurrent webhook`
              );
            }
          } else {
            const advanceRupees = paidAmount / 100;
            const balanceDue = Math.max(0, Number(booking.totalAmount) - advanceRupees);
            const paymentStatus = balanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID';

            const claimed = await Booking.findOneAndUpdate(
              {
                _id: booking._id,
                paymentStatus: { $ne: 'PAID' },
                bookingStatus: { $ne: 'CANCELLED' },
              },
              {
                $set: {
                  advancePaid: advanceRupees,
                  balanceDue,
                  paymentStatus,
                  bookingStatus: 'CONFIRMED',
                },
                $push: {
                  timeline: {
                    status: 'CONFIRMED',
                    note: `Advance token verified via Razorpay (${paymentId})`,
                    updatedBy: 'Razorpay Webhook',
                    timestamp: new Date(),
                  },
                },
              },
              { new: true }
            );

            if (!claimed) {
              console.log(
                `[Razorpay Webhook] Booking ${booking.bookingNumber} was already processed by a concurrent webhook`
              );
            } else {
              await triggerAutomation({
                businessId: claimed.businessId,
                trigger: 'BOOKING_CONFIRMED',
                entityType: 'BOOKING',
                entityId: claimed._id.toString(),
                data: {
                  bookingNumber: claimed.bookingNumber,
                  customerName: claimed.customerName,
                  packageName: claimed.packageName,
                  advancePaid: claimed.advancePaid,
                },
              });
            }
          }
        } else if (booking) {
          console.log(
            `[Razorpay Webhook] Booking ${booking.bookingNumber} is already paid; ignoring replay`
          );
        }
      }
    }

    res.status(200).json({ success: true, message: 'Razorpay webhook processed' });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleRazorpayWebhook,
  verifyRazorpaySignature,
};
