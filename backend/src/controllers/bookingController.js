const mongoose = require('mongoose');
const crypto = require('crypto');
const ServicePackage = require('../models/ServicePackage');
const Booking = require('../models/Booking');
const BookingCapacity = require('../models/BookingCapacity');
const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const { sendCapiEvent } = require('../services/metaCapiService');
const { triggerAutomation } = require('../services/automationEngine');
const { buildAppUrl } = require('../utils/appUrl');

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const MAX_BOOKING_YEARS_AHEAD = 5;

const generateBookingNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BK-${ts}-${rand}`;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseEventDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

// Reserve capacity with an atomic conditional increment. The first booking for
// a package/date inserts the counter; all later bookings increment it only if
// the requested units still fit.
const reserveBookingCapacity = async ({ businessId, pkg, dateKey, units }) => {
  const capacity = Number(pkg.maxCapacityPerDay);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { required: false, reserved: false };
  }
  if (units > capacity) {
    return { required: true, reserved: false, capacity };
  }

  const counterId = `${businessId}:${pkg._id.toString()}:${dateKey}`;
  const query = {
    _id: counterId,
    $expr: { $lte: [{ $add: ['$reservedCount', units] }, capacity] },
  };

  let counter = await BookingCapacity.findOneAndUpdate(
    query,
    { $inc: { reservedCount: units }, $set: { capacity } },
    { new: true }
  );
  if (counter) return { required: true, reserved: true, capacity };

  const existing = await BookingCapacity.findOne({ _id: counterId });
  if (existing) return { required: true, reserved: false, capacity };

  try {
    counter = await BookingCapacity.create({
      _id: counterId,
      businessId,
      packageId: pkg._id,
      dateKey,
      capacity,
      reservedCount: units,
    });
    return { required: true, reserved: true, capacity };
  } catch (error) {
    if (error.code !== 11000) throw error;
    counter = await BookingCapacity.findOneAndUpdate(
      query,
      { $inc: { reservedCount: units }, $set: { capacity } },
      { new: true }
    );
    return counter
      ? { required: true, reserved: true, capacity }
      : { required: true, reserved: false, capacity };
  }
};

const releaseBookingCapacity = async (booking) => {
  if (!booking?.capacityReserved || !booking.packageId || !booking.capacityDateKey) {
    return;
  }
  const units = Math.max(1, Number(booking.capacityUnits) || 1);
  try {
    await BookingCapacity.updateOne(
      {
        businessId: booking.businessId,
        packageId: booking.packageId,
        dateKey: booking.capacityDateKey,
        reservedCount: { $gte: units },
      },
      { $inc: { reservedCount: -units } }
    );
  } catch (error) {
    console.warn('[Booking Capacity Release Warning]:', error.message);
  }
};

// ==================== PACKAGES ====================

// @desc    Get all service packages for merchant
// @route   GET /api/packages
// @access  Private (Merchant Admin/Staff)
const getServicePackages = async (req, res) => {
  try {
    const packages = await ServicePackage.find({ businessId: req.businessId }).sort({ createdAt: -1 });
    res.json({ success: true, count: packages.length, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a service package
// @route   POST /api/packages
// @access  Private (Merchant Admin)
const createServicePackage = async (req, res) => {
  try {
    const {
      name,
      slug,
      category,
      description,
      duration,
      price,
      advanceTokenPercent,
      deliverables,
      images,
      maxCapacityPerDay,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Package name and price are required' });
    }

    const pkgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await ServicePackage.findOne({ businessId: req.businessId, slug: pkgSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A package with this slug already exists' });
    }

    const pkg = await ServicePackage.create({
      businessId: req.businessId,
      name,
      slug: pkgSlug,
      category: category || '',
      description: description || '',
      duration: duration || '',
      price: Number(price),
      advanceTokenPercent: advanceTokenPercent !== undefined ? Number(advanceTokenPercent) : 0,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      images: Array.isArray(images) ? images : [],
      maxCapacityPerDay: maxCapacityPerDay ? Number(maxCapacityPerDay) : 1,
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update service package
// @route   PUT /api/packages/:id
// @access  Private (Merchant Admin)
const updateServicePackage = async (req, res) => {
  try {
    const pkg = await ServicePackage.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Service package not found' });
    }

    const fields = [
      'name',
      'slug',
      'category',
      'description',
      'duration',
      'price',
      'advanceTokenPercent',
      'deliverables',
      'images',
      'isAvailable',
      'maxCapacityPerDay',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        pkg[field] = req.body[field];
      }
    });

    await pkg.save();
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete service package
// @route   DELETE /api/packages/:id
// @access  Private (Merchant Admin)
const deleteServicePackage = async (req, res) => {
  try {
    const pkg = await ServicePackage.findOneAndDelete({ _id: req.params.id, businessId: req.businessId });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Service package not found' });
    }
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== BOOKINGS ====================

// @desc    Get all bookings for merchant
// @route   GET /api/bookings
// @access  Private (Merchant Admin/Staff)
const getBookings = async (req, res) => {
  try {
    const { bookingStatus, bookingType, search, page = 1, limit = 50 } = req.query;
    const filter = { businessId: req.businessId };

    if (bookingStatus) filter.bookingStatus = bookingStatus;
    if (bookingType) filter.bookingType = bookingType;
    if (search && String(search).trim()) {
      const tokens = String(search).trim().split(/\s+/).filter(Boolean);
      const andClauses = tokens.map((token) => {
        const safeToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return {
          $or: [
            { bookingNumber: { $regex: safeToken, $options: 'i' } },
            { customerName: { $regex: safeToken, $options: 'i' } },
            { customerPhone: { $regex: safeToken, $options: 'i' } },
            { customerEmail: { $regex: safeToken, $options: 'i' } },
            { packageName: { $regex: safeToken, $options: 'i' } },
            { location: { $regex: safeToken, $options: 'i' } },
            { assignedStaffName: { $regex: safeToken, $options: 'i' } },
            { notes: { $regex: safeToken, $options: 'i' } },
          ],
        };
      });
      if (andClauses.length > 0) {
        filter.$and = andClauses;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort({ eventDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: bookings.length,
      total,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Merchant Admin/Staff)
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status, assign staff, or record payment
// @route   PATCH /api/bookings/:id/status
// @access  Private (Merchant Admin/Staff)
const updateBookingStatus = async (req, res) => {
  try {
    const {
      bookingStatus,
      assignedStaff,
      assignedStaffName,
      advancePaid,
      note,
    } = req.body;

    if (bookingStatus && !BOOKING_STATUSES.includes(bookingStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.bookingStatus === 'CANCELLED' && bookingStatus && bookingStatus !== 'CANCELLED') {
      return res.status(409).json({
        success: false,
        message: 'A cancelled booking cannot be reopened. Ask the customer to submit a new request.',
      });
    }

    const updater = req.user ? `${req.user.name} (${req.user.role})` : 'Merchant Admin';

    if (bookingStatus && bookingStatus !== booking.bookingStatus) {
      if (bookingStatus === 'CANCELLED') {
        // Claim the release once so concurrent cancellations cannot free the
        // same capacity twice.
        const capacityClaim = await Booking.findOneAndUpdate(
          {
            _id: booking._id,
            businessId: booking.businessId,
            capacityReleased: { $ne: true },
          },
          { $set: { capacityReleased: true } },
          { new: true }
        );
        if (capacityClaim?.capacityReserved) {
          await releaseBookingCapacity(capacityClaim);
        }
        booking.capacityReleased = true;
      }

      booking.bookingStatus = bookingStatus;
      booking.timeline.push({
        status: bookingStatus,
        note: note || `Booking stage updated to ${bookingStatus}`,
        updatedBy: updater,
        timestamp: new Date(),
      });
    }

    if (assignedStaff !== undefined) {
      booking.assignedStaff = assignedStaff || null;
    }
    if (assignedStaffName !== undefined) {
      booking.assignedStaffName = assignedStaffName || 'Unassigned';
    }

    if (advancePaid !== undefined) {
      const adv = Number(advancePaid);
      if (!Number.isFinite(adv) || adv < 0) {
        return res.status(400).json({ success: false, message: 'Invalid advancePaid value' });
      }
      if (adv > booking.totalAmount) {
        return res.status(400).json({ success: false, message: 'advancePaid cannot exceed totalAmount' });
      }
      booking.advancePaid = adv;
      booking.balanceDue = Math.max(0, booking.totalAmount - adv);
      if (adv >= booking.totalAmount) {
        booking.paymentStatus = 'PAID';
      } else if (adv > 0) {
        booking.paymentStatus = 'PARTIALLY_PAID';
      } else {
        booking.paymentStatus = 'UNPAID';
      }
    }

    if (note && !bookingStatus) {
      booking.timeline.push({
        status: booking.bookingStatus,
        note,
        updatedBy: updater,
        timestamp: new Date(),
      });
    }

    await booking.save();
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booking KPIs & stats
// @route   GET /api/bookings/stats
// @access  Private (Merchant Admin/Staff)
const getBookingStats = async (req, res) => {
  try {
    const businessId = req.businessId;

    const [totalBookings, statusCounts, financialStats] = await Promise.all([
      Booking.countDocuments({ businessId }),
      Booking.aggregate([
        { $match: { businessId } },
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { businessId, bookingStatus: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: null,
            totalBookedValue: { $sum: '$totalAmount' },
            advanceCollected: { $sum: '$advancePaid' },
            balanceDue: { $sum: '$balanceDue' },
          },
        },
      ]),
    ]);

    const statusMap = {
      PENDING: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    statusCounts.forEach((s) => {
      if (statusMap[s._id] !== undefined) statusMap[s._id] = s.count;
    });

    const finances = financialStats[0] || {
      totalBookedValue: 0,
      advanceCollected: 0,
      balanceDue: 0,
    };

    res.json({
      success: true,
      data: {
        totalBookings,
        statusCounts: statusMap,
        finances,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PUBLIC BOOKINGS ====================

// @desc    Submit a public booking request (Photography Shoot or Travel Tour)
// @route   POST /api/public/store/:slug/book
// @access  Public
const createPublicBooking = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      packageId,
      customerName,
      customerPhone,
      customerEmail,
      eventDate,
      timeSlot,
      location = '',
      passengers = [],
      notes = '',
      attribution = {},
    } = req.body;

    if (!customerName || !customerPhone || !eventDate || !String(timeSlot || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, booking date, and time slot are required',
      });
    }

    const parsedEventDate = parseEventDate(eventDate);
    if (!parsedEventDate) {
      return res.status(400).json({ success: false, message: 'Enter a valid booking date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(parsedEventDate);
    requestedDate.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Booking date cannot be in the past',
      });
    }
    const latestAllowedDate = new Date(today);
    latestAllowedDate.setFullYear(latestAllowedDate.getFullYear() + MAX_BOOKING_YEARS_AHEAD);
    if (requestedDate > latestAllowedDate) {
      return res.status(400).json({
        success: false,
        message: `Booking date cannot be more than ${MAX_BOOKING_YEARS_AHEAD} years in the future`,
      });
    }

    // Match createPublicOrder: normalize and validate Indian mobile numbers.
    let cleanCustomerPhone = String(customerPhone).replace(/\D/g, '');
    if (cleanCustomerPhone.length === 12 && cleanCustomerPhone.startsWith('91')) {
      cleanCustomerPhone = cleanCustomerPhone.slice(2);
    } else if (cleanCustomerPhone.length === 11 && cleanCustomerPhone.startsWith('0')) {
      cleanCustomerPhone = cleanCustomerPhone.slice(1);
    }
    if (!/^[6-9]\d{9}$/.test(cleanCustomerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Provide a valid 10-digit Indian phone number.',
      });
    }

    const tenant = await Tenant.findOne({ slug, status: 'ACTIVE' });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Business storefront not found or inactive' });
    }

    let packageName = 'Custom Booking Request';
    let totalAmount = 0;
    let advanceTokenPercent = 0;
    let selectedPackage = null;

    if (packageId) {
      if (!mongoose.Types.ObjectId.isValid(packageId)) {
        return res.status(400).json({ success: false, message: 'Invalid service package' });
      }
      const pkg = await ServicePackage.findOne({
        _id: packageId,
        businessId: tenant._id,
        isAvailable: true,
      });
      if (!pkg) {
        return res.status(404).json({ success: false, message: 'Service package not found or unavailable' });
      }
      selectedPackage = pkg;
      packageName = pkg.name;
      totalAmount = Number(pkg.price) || 0;
      advanceTokenPercent = Number.isFinite(Number(pkg.advanceTokenPercent))
        ? Number(pkg.advanceTokenPercent)
        : 0;
    }

    // Reserve the package's daily capacity before creating the booking. This
    // is atomic, so concurrent requests cannot both take the last slot.
    const capacityDateKey = toDateKey(requestedDate);
    const capacityUnits =
      tenant.businessType === 'TRAVEL' && Array.isArray(passengers) && passengers.length > 0
        ? passengers.length
        : 1;
    let capacityReservation = { required: false, reserved: false };

    if (selectedPackage) {
      capacityReservation = await reserveBookingCapacity({
        businessId: tenant._id,
        pkg: selectedPackage,
        dateKey: capacityDateKey,
        units: capacityUnits,
      });
      if (capacityReservation.required && !capacityReservation.reserved) {
        return res.status(409).json({
          success: false,
          message: `The selected date is fully booked${capacityReservation.capacity ? ` (capacity: ${capacityReservation.capacity} per day)` : ''}. Please choose another date.`,
        });
      }
    }

    // A public booking request is not a payment. Prices come from the package,
    // never from the browser, and no advance is recorded until a verified
    // Razorpay webhook confirms the capture.
    const expectedAdvance = Math.round((totalAmount * advanceTokenPercent) / 100);
    const balanceDue = totalAmount;

    let bookingNumber = generateBookingNumber();

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const enrichedAttribution = {
      ...attribution,
      clientIp: attribution.clientIp || clientIp,
      userAgent: attribution.userAgent || userAgent,
    };

    let booking = null;
    let lastBookingError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        booking = await Booking.create({
          businessId: tenant._id,
          bookingNumber,
          bookingType: tenant.businessType === 'TRAVEL' ? 'TRAVEL' : 'SERVICE',
          packageId: packageId || null,
          packageName,
          customerName,
          customerPhone: cleanCustomerPhone,
          customerEmail: customerEmail || '',
          eventDate: parsedEventDate,
          timeSlot,
          location,
          totalAmount,
          advancePaid: 0,
          advanceTokenPercent,
          expectedAdvance,
          balanceDue,
          paymentStatus: 'UNPAID',
          bookingStatus: 'PENDING',
          capacityReserved: Boolean(capacityReservation.required && capacityReservation.reserved),
          capacityDateKey,
          capacityUnits,
          passengers: Array.isArray(passengers) ? passengers : [],
          notes,
          attribution: enrichedAttribution,
          timeline: [
            {
              status: 'PENDING',
              note: `Booking request received for ${packageName} on ${parsedEventDate.toDateString()}`,
              updatedBy: 'Customer Online',
              timestamp: new Date(),
            },
          ],
        });
        break;
      } catch (bookingErr) {
        lastBookingError = bookingErr;
        const isNumberCollision =
          bookingErr.code === 11000 &&
          Boolean(
            bookingErr.keyPattern?.bookingNumber ||
              String(bookingErr.message || '').includes('bookingNumber')
          );
        if (isNumberCollision && attempt < 2) {
          bookingNumber = generateBookingNumber();
          continue;
        }
        break;
      }
    }

    if (!booking) {
      if (capacityReservation.required && capacityReservation.reserved) {
        await BookingCapacity.updateOne(
          {
            businessId: tenant._id,
            packageId: selectedPackage._id,
            dateKey: capacityDateKey,
            reservedCount: { $gte: capacityUnits },
          },
          { $inc: { reservedCount: -capacityUnits } }
        );
      }
      throw lastBookingError;
    }

    // Fire Automation Engine Event
    await triggerAutomation({
      businessId: tenant._id,
      trigger: 'BOOKING_CREATED',
      entityType: 'BOOKING',
      entityId: booking._id.toString(),
      data: {
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        packageName: booking.packageName,
        totalAmount: booking.totalAmount,
        advancePaid: booking.advancePaid,
      },
    }).catch((err) => console.error('[Automation Booking Trigger Error]:', err.message));

    // Sync Customer / Enquiry into CRM Lead Pipeline
    try {
      const existingLead = await Lead.findOne({ businessId: tenant._id, phone: cleanCustomerPhone });

      if (existingLead) {
        existingLead.budget = Math.max(Number(existingLead.budget) || 0, Number(totalAmount) || 0);
        existingLead.notes.push({
          note: `Booking request ${bookingNumber} placed for ${packageName} on ${parsedEventDate.toDateString()}`,
          authorName: 'Online Booking System',
          createdAt: new Date(),
        });
        await existingLead.save();
      } else {
        await Lead.create({
          businessId: tenant._id,
          name: customerName,
          phone: cleanCustomerPhone,
          email: customerEmail || '',
          source: 'WEBSITE',
          campaignName: enrichedAttribution.utmCampaign || '',
          utmSource: enrichedAttribution.utmSource || '',
          utmCampaign: enrichedAttribution.utmCampaign || '',
          status: 'NEW',
          budget: totalAmount,
          notes: [
            {
              note: `Initial Booking request ${bookingNumber} for ${packageName}`,
              authorName: 'Online Booking System',
              createdAt: new Date(),
            },
          ],
        });
      }
    } catch (leadSyncErr) {
      console.error('[CRM Booking Sync Warning]:', leadSyncErr.message);
    }

    // Fire Meta CAPI 'Schedule' event asynchronously
    const metaPixelId =
      tenant.settings?.metaPixelId || tenant.integrations?.meta?.pixelId;
    const metaCapiToken =
      tenant.settings?.metaCapiToken || tenant.integrations?.meta?.capiToken;
    if (metaPixelId && metaCapiToken) {
      sendCapiEvent({
        tenant,
        eventName: 'Schedule',
        eventId: booking.bookingNumber,
        eventSourceUrl: req.headers.referer || buildAppUrl(req, `/store/${slug}`) || undefined,
        userData: {
          email: customerEmail,
          phone: cleanCustomerPhone,
          fbclid: enrichedAttribution.fbclid,
        },
        customData: {
          currency: tenant.settings.currency || 'INR',
          value: totalAmount,
          contentName: packageName,
        },
      }).catch((err) => console.error('[CAPI Schedule Event Error]:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      data: {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        packageName: booking.packageName,
        eventDate: booking.eventDate,
        totalAmount: booking.totalAmount,
        advancePaid: booking.advancePaid,
        expectedAdvance: booking.expectedAdvance,
        advanceTokenPercent: booking.advanceTokenPercent,
        balanceDue: booking.balanceDue,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServicePackages,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getBookingStats,
  createPublicBooking,
};
