const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide branch name'],
      trim: true,
      maxlength: 120,
    },
    code: {
      type: String,
      required: [true, 'Please provide branch code (e.g. MAIN, HQ, WING-B)'],
      uppercase: true,
      trim: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    coordinates: {
      lat: { type: Number, default: 28.545 },
      lng: { type: Number, default: 77.192 },
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    operatingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      days: { type: [Number], default: [1, 2, 3, 4, 5] },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ organisationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);
