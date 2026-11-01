const mongoose = require('mongoose');

const queueSessionSchema = new mongoose.Schema(
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
      default: 0,
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
queueSessionSchema.index({ organisationId: 1, sessionDate: 1 });

module.exports = mongoose.model('QueueSession', queueSessionSchema);
