const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    counterNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    currentTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'busy', 'on_break', 'closed'],
      default: 'closed',
    },
    todayServedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure counterNumber is unique per service
counterSchema.index({ serviceId: 1, counterNumber: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
