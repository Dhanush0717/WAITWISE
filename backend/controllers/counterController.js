const Counter = require('../models/Counter');
const Service = require('../models/Service');
const { emitToService, emitToAdmin } = require('../sockets/socketHandler');
const { logAction } = require('../utils/auditLogger');

// @desc    List counters (optionally filtered by service)
// @route   GET /api/counters?serviceId=xxx
// @access  Public
const listCounters = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.serviceId) {
      filter.serviceId = req.query.serviceId;
    }

    const counters = await Counter.find(filter)
      .populate('serviceId', 'name code status')
      .populate('assignedStaff', 'name email')
      .populate('currentTicket', 'ticketNumber customerName')
      .sort({ serviceId: 1, counterNumber: 1 });

    res.status(200).json({
      success: true,
      count: counters.length,
      data: counters,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new counter for a service
// @route   POST /api/counters
// @access  Private (Admin)
const createCounter = async (req, res, next) => {
  try {
    const { serviceId, counterNumber, name, assignedStaff } = req.body;

    if (!serviceId || !counterNumber || !name) {
      return res.status(400).json({
        success: false,
        message: 'serviceId, counterNumber, and name are required',
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const existing = await Counter.findOne({ serviceId, counterNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Counter #${counterNumber} already exists for ${service.name}`,
      });
    }

    const counter = await Counter.create({
      serviceId,
      counterNumber,
      name,
      assignedStaff: assignedStaff || null,
      status: 'closed',
    });

    await logAction({
      actorId: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : 'System',
      actorRole: req.user ? req.user.role : 'staff',
      action: 'COUNTER_CREATED',
      resourceType: 'Counter',
      resourceId: counter._id,
      metadata: { serviceId, counterNumber, name },
    });

    res.status(201).json({
      success: true,
      data: counter,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update counter details & staff assignment
// @route   PUT /api/counters/:id
// @access  Private (Admin or assigned Staff)
const updateCounter = async (req, res, next) => {
  try {
    const counter = await Counter.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('serviceId', 'name code')
      .populate('assignedStaff', 'name email');

    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    emitToService(counter.serviceId._id, 'counterStatusChanged', {
      counterId: counter._id,
      status: counter.status,
      assignedStaff: counter.assignedStaff,
    });

    res.status(200).json({
      success: true,
      data: counter,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle counter status (open, busy, on_break, closed)
// @route   PATCH /api/counters/:id/status
// @access  Private (Staff or Admin)
const toggleCounterStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['open', 'busy', 'on_break', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be open, busy, on_break, or closed.',
      });
    }

    const counter = await Counter.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('serviceId', 'name code');

    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    emitToService(counter.serviceId._id, 'counterStatusChanged', {
      counterId: counter._id,
      counterNumber: counter.counterNumber,
      status: counter.status,
    });

    await logAction({
      actorId: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : 'System',
      actorRole: req.user ? req.user.role : 'staff',
      action: `COUNTER_STATUS_${status.toUpperCase()}`,
      resourceType: 'Counter',
      resourceId: counter._id,
    });

    res.status(200).json({
      success: true,
      data: counter,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCounters,
  createCounter,
  updateCounter,
  toggleCounterStatus,
};
