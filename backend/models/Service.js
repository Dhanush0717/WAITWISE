const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      default: null,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide service name'],
      trim: true,
      maxlength: 120,
    },
    code: {
      type: String,
      required: [true, 'Please provide service code (e.g. OPD, ACC, EXM, REG)'],
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    location: {
      building: {
        type: String,
        default: 'Main Facility',
      },
      room: {
        type: String,
        default: 'Counter Hall 1',
      },
      coordinates: {
        lat: { type: Number, default: 28.545 },
        lng: { type: Number, default: 77.192 },
      },
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
    estimatedServiceTimeMinutes: {
      type: Number,
      default: 5,
      min: 1,
      max: 180,
    },
    maxQueueCapacity: {
      type: Number,
      default: 100,
      min: 5,
    },
    overflowThreshold: {
      type: Number,
      default: 15,
      min: 3,
    },
    isKioskEnabled: {
      type: Boolean,
      default: true,
    },
    isSelfJoinEnabled: {
      type: Boolean,
      default: true,
    },
    qrJoinKey: {
      type: String,
      default: () => Math.random().toString(36).substring(2, 12).toUpperCase(),
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ organisationId: 1, code: 1 });
serviceSchema.index({ organisationId: 1, branchId: 1 });

module.exports = mongoose.model('Service', serviceSchema);
