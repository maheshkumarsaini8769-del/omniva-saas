const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, default: 0 },
    gender: { type: String, default: 'Other' },
    seatNo: { type: String, default: '' },
    pickupPoint: { type: String, default: '' },
  },
  { _id: true }
);

const bookingTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    updatedBy: { type: String, default: 'System' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant business ID is required'],
      index: true,
    },
    bookingNumber: {
      type: String,
      required: true,
      index: true,
    },
    bookingType: {
      type: String,
      enum: ['SERVICE', 'TRAVEL'],
      default: 'SERVICE',
      index: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePackage',
      default: null,
    },
    packageName: {
      type: String,
      required: [true, 'Package or service name is required'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Booking date is required'],
      index: true,
    },
    timeSlot: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    advancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceTokenPercent: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    expectedAdvance: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedStaffName: {
      type: String,
      default: 'Unassigned',
    },
    passengers: {
      type: [passengerSchema],
      default: [],
    },
    attribution: {
      utmSource: { type: String, default: '' },
      utmMedium: { type: String, default: '' },
      utmCampaign: { type: String, default: '' },
      utmContent: { type: String, default: '' },
      fbclid: { type: String, default: '' },
      clientIp: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },
    notes: {
      type: String,
      default: '',
    },
    timeline: {
      type: [bookingTimelineSchema],
      default: () => [
        {
          status: 'PENDING',
          note: 'Booking requested by customer',
          updatedBy: 'Customer',
          timestamp: new Date(),
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ businessId: 1, bookingNumber: 1 }, { unique: true });
bookingSchema.index({ businessId: 1, eventDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
