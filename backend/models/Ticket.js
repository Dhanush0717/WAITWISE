const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      index: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
      index: true,
    },
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
    queueSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueSession',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Guest Visitor',
    },
    customerIdentifier: {
      type: String,
      trim: true,
      default: '',
    },
    joinMethod: {
      type: String,
      enum: ['qr_mobile', 'web_portal', 'kiosk', 'staff_assisted'],
      default: 'web_portal',
    },
    status: {
      type: String,
      enum: [
        'WAITING',
        'CALLED',
        'SERVING',
        'COMPLETED',
        'CANCELLED',
        'SKIPPED',
        'NO_SHOW',
        'EXPIRED',
      ],
      default: 'WAITING',
      index: true,
    },
    guestAccessToken: {
      type: String,
      default: null,
      index: true,
    },
    assignedCounter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      default: null,
    },
    servedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    skipReason: {
      type: String,
      default: '',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    serviceStartedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    actualDurationMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ organisationId: 1, status: 1 });
ticketSchema.index({ serviceId: 1, status: 1, sequenceNumber: 1 });
ticketSchema.index({ serviceId: 1, status: 1, joinedAt: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
