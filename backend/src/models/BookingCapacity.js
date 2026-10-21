const mongoose = require('mongoose');

// One counter per tenant, package, and calendar date. The counter is updated
// with an atomic conditional $inc so concurrent bookings cannot both consume
// the last available capacity.
const bookingCapacitySchema = new mongoose.Schema(
  {
    // Deterministic string id doubles as a uniqueness guard even on a database
    // where the compound index has not been synchronised yet.
    _id: {
      type: String,
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePackage',
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    reservedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

bookingCapacitySchema.index(
  { businessId: 1, packageId: 1, dateKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('BookingCapacity', bookingCapacitySchema);
