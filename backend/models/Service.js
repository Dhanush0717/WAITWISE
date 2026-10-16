const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide service name'],
      trim: true,
      maxlength: 120,
    },
    code: {
      type: String,
      required: [true, 'Please provide service code (e.g. ADM, LIB)'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 6,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['administration', 'academic', 'dining', 'library', 'health', 'finance', 'facility', 'other'],
      default: 'administration',
    },
    location: {
      building: {
        type: String,
        default: 'Main Administration Block',
      },
      room: {
        type: String,
        default: 'Ground Floor, Room 101',
      },
      coordinates: {
        lat: { type: Number, default: 28.545 },
        lng: { type: Number, default: 77.192 },
      },
    },
    operatingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      days: { type: [Number], default: [1, 2, 3, 4, 5] }, // 1=Mon, 5=Fri
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
      max: 120,
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

module.exports = mongoose.model('Service', serviceSchema);
