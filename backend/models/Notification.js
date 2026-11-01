const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      default: null,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    guestToken: {
      type: String,
      default: null,
      index: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'ticket_created',
        'turn_approaching',
        'token_called',
        'service_started',
        'token_completed',
        'token_skipped',
        'service_paused',
        'overload_alert',
        'system',
      ],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ guestToken: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ organisationId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
