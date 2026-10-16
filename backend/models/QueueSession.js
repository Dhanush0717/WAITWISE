const mongoose = require('mongoose');

const queueSessionSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    sessionDate: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    tokenSequence: {
      type: Number,
      default: 0, // Incremented atomically using findOneAndUpdate with $inc
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
    },
    totalTokensIssued: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

queueSessionSchema.index({ serviceId: 1, sessionDate: 1 }, { unique: true });

module.exports = mongoose.model('QueueSession', queueSessionSchema);
