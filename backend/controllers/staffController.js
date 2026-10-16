const Ticket = require('../models/Ticket');
const Counter = require('../models/Counter');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const { emitToService, emitToTicket, emitToUser, emitToAdmin } = require('../sockets/socketHandler');
const { logAction } = require('../utils/auditLogger');

// @desc    Get staff assigned counter, service, and live queue lists
// @route   GET /api/staff/my-station
// @access  Private (Staff or Admin)
const getMyStation = async (req, res, next) => {
  try {
    const user = req.user;
    let counter = null;

    if (user.assignedCounter) {
      counter = await Counter.findById(user.assignedCounter)
        .populate('serviceId')
        .populate('currentTicket');
    } else {
      // Find any counter assigned to this staff member
      counter = await Counter.findOne({ assignedStaff: user._id })
        .populate('serviceId')
        .populate('currentTicket');
    }

    const serviceId = counter ? counter.serviceId._id : user.assignedService;

    if (!serviceId) {
      return res.status(200).json({
        success: true,
        message: 'No service or counter assigned yet. Please contact an administrator.',
        data: { counter: null, service: null, waitingQueue: [], calledQueue: [] },
      });
    }

    const service = await Service.findById(serviceId);

    const [waitingQueue, calledQueue, servingQueue, todayStats] = await Promise.all([
      Ticket.find({ serviceId, status: 'WAITING' })
        .sort({ sequenceNumber: 1 })
        .limit(30),
      Ticket.find({ serviceId, status: 'CALLED' })
        .populate('assignedCounter', 'counterNumber name')
        .sort({ calledAt: -1 }),
      Ticket.find({ serviceId, status: 'SERVING' })
        .populate('assignedCounter', 'counterNumber name')
        .sort({ serviceStartedAt: -1 }),
      Ticket.aggregate([
        {
          $match: {
            serviceId,
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statsMap = {};
    todayStats.forEach((s) => {
      statsMap[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      data: {
        counter,
        service,
        waitingQueue,
        calledQueue,
        servingQueue,
        stats: {
          waiting: statsMap['WAITING'] || 0,
          called: statsMap['CALLED'] || 0,
          serving: statsMap['SERVING'] || 0,
          completed: statsMap['COMPLETED'] || 0,
          skipped: statsMap['SKIPPED'] || 0,
          noShow: statsMap['NO_SHOW'] || 0,
          cancelled: statsMap['CANCELLED'] || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Call next eligible token in FIFO queue
// @route   POST /api/staff/call-next
// @access  Private (Staff or Admin)
const callNext = async (req, res, next) => {
  try {
    const { counterId } = req.body;
    let targetCounterId = counterId || req.user.assignedCounter;

    let counter = await Counter.findById(targetCounterId).populate('serviceId');
    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    const serviceId = counter.serviceId._id;

    // Find the oldest WAITING ticket for this service
    // Concurrency prevention: atomically find and update using findOneAndUpdate with status: 'WAITING'
    const candidateTicket = await Ticket.findOne({
      serviceId,
      status: 'WAITING',
    }).sort({ sequenceNumber: 1 });

    if (!candidateTicket) {
      return res.status(404).json({
        success: false,
        message: 'No waiting customers in the queue for this service.',
      });
    }

    // Atomic state transition: WAITING -> CALLED
    const ticket = await Ticket.findOneAndUpdate(
      { _id: candidateTicket._id, status: 'WAITING' },
      {
        $set: {
          status: 'CALLED',
          assignedCounter: counter._id,
          servedBy: req.user._id,
          calledAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('serviceId')
      .populate('assignedCounter', 'counterNumber name');

    if (!ticket) {
      return res.status(409).json({
        success: false,
        message: 'This ticket was already claimed by another operator. Please try again.',
      });
    }

    // Update Counter current ticket and status
    counter.currentTicket = ticket._id;
    counter.status = 'busy';
    await counter.save();

    // Create Notification for the customer
    await Notification.create({
      recipient: ticket.userId,
      guestToken: ticket.guestAccessToken,
      ticketId: ticket._id,
      title: `Token ${ticket.ticketNumber} Called!`,
      message: `Please proceed immediately to ${counter.name}. Your turn is ready.`,
      type: 'token_called',
    });

    // Notify ticket owner directly
    emitToTicket(ticket._id, 'tokenCalled', {
      ticketNumber: ticket.ticketNumber,
      counterName: counter.name,
      counterNumber: counter.counterNumber,
      calledAt: ticket.calledAt,
    });

    // Notify all clients subscribed to this service
    emitToService(serviceId, 'tokenCalled', {
      ticketNumber: ticket.ticketNumber,
      counterName: counter.name,
      counterNumber: counter.counterNumber,
      serviceId,
    });

    // Send queueUpdated
    const remainingWaiting = await Ticket.countDocuments({ serviceId, status: 'WAITING' });
    emitToService(serviceId, 'queueUpdated', { serviceId, waitingCount: remainingWaiting });

    await logAction({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'TOKEN_CALLED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber: ticket.ticketNumber, counterName: counter.name },
    });

    res.status(200).json({
      success: true,
      message: `Token ${ticket.ticketNumber} called to ${counter.name}`,
      data: { ticket, counter },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start servicing the customer (CALLED -> SERVING)
// @route   POST /api/staff/start-service
// @access  Private (Staff or Admin)
const startService = async (req, res, next) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, status: 'CALLED' },
      {
        $set: {
          status: 'SERVING',
          serviceStartedAt: new Date(),
        },
      },
      { new: true }
    ).populate('assignedCounter', 'counterNumber name');

    if (!ticket) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not in CALLED state or already serving',
      });
    }

    emitToService(ticket.serviceId, 'serviceStarted', {
      ticketNumber: ticket.ticketNumber,
      counterName: ticket.assignedCounter ? ticket.assignedCounter.name : 'Counter',
      serviceStartedAt: ticket.serviceStartedAt,
    });

    emitToTicket(ticket._id, 'serviceStarted', {
      ticketNumber: ticket.ticketNumber,
      status: 'SERVING',
    });

    await logAction({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'SERVICE_STARTED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    res.status(200).json({
      success: true,
      message: `Service started for ${ticket.ticketNumber}`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete service (SERVING -> COMPLETED)
// @route   POST /api/staff/complete-service
// @access  Private (Staff or Admin)
const completeService = async (req, res, next) => {
  try {
    const { ticketId, counterId } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (!['CALLED', 'SERVING'].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: `Ticket cannot be completed from state ${ticket.status}`,
      });
    }

    const completedAt = new Date();
    const start = ticket.serviceStartedAt || ticket.calledAt || completedAt;
    const actualDurationMinutes = Math.max(
      1,
      Math.round((completedAt - start) / (1000 * 60))
    );

    ticket.status = 'COMPLETED';
    ticket.completedAt = completedAt;
    ticket.actualDurationMinutes = actualDurationMinutes;
    await ticket.save();

    // Free the counter
    const targetCounterId = counterId || ticket.assignedCounter;
    if (targetCounterId) {
      await Counter.findByIdAndUpdate(targetCounterId, {
        currentTicket: null,
        status: 'open',
        $inc: { todayServedCount: 1 },
      });
    }

    // In-app notification for ticket owner
    await Notification.create({
      recipient: ticket.userId,
      guestToken: ticket.guestAccessToken,
      ticketId: ticket._id,
      title: `Service Completed: ${ticket.ticketNumber}`,
      message: `Your service at ${ticket.serviceId.name || 'Counter'} has been completed. Thank you!`,
      type: 'token_completed',
    });

    emitToService(ticket.serviceId, 'tokenCompleted', {
      ticketNumber: ticket.ticketNumber,
      counterId: targetCounterId,
      actualDurationMinutes,
    });

    emitToTicket(ticket._id, 'tokenCompleted', {
      ticketNumber: ticket.ticketNumber,
      status: 'COMPLETED',
    });

    await logAction({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'SERVICE_COMPLETED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber: ticket.ticketNumber, actualDurationMinutes },
    });

    res.status(200).json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} marked as completed (${actualDurationMinutes} mins)`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Skip ticket with mandatory reason
// @route   POST /api/staff/skip
// @access  Private (Staff or Admin)
const skipTicket = async (req, res, next) => {
  try {
    const { ticketId, reason, counterId } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'A skip reason is required (e.g. Missing documents, Stepped out)',
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = 'SKIPPED';
    ticket.skipReason = reason;
    await ticket.save();

    // Free counter
    const targetCounterId = counterId || ticket.assignedCounter;
    if (targetCounterId) {
      await Counter.findByIdAndUpdate(targetCounterId, {
        currentTicket: null,
        status: 'open',
      });
    }

    emitToService(ticket.serviceId, 'tokenSkipped', {
      ticketNumber: ticket.ticketNumber,
      reason,
    });

    emitToTicket(ticket._id, 'tokenSkipped', {
      ticketNumber: ticket.ticketNumber,
      status: 'SKIPPED',
      reason,
    });

    await logAction({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'TOKEN_SKIPPED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber: ticket.ticketNumber, reason },
    });

    res.status(200).json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} marked as skipped`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark ticket as NO_SHOW
// @route   POST /api/staff/no-show
// @access  Private (Staff or Admin)
const markNoShow = async (req, res, next) => {
  try {
    const { ticketId, counterId } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = 'NO_SHOW';
    ticket.skipReason = 'Customer did not show up when called';
    await ticket.save();

    const targetCounterId = counterId || ticket.assignedCounter;
    if (targetCounterId) {
      await Counter.findByIdAndUpdate(targetCounterId, {
        currentTicket: null,
        status: 'open',
      });
    }

    emitToService(ticket.serviceId, 'tokenSkipped', {
      ticketNumber: ticket.ticketNumber,
      reason: 'No show',
    });

    emitToTicket(ticket._id, 'tokenSkipped', {
      ticketNumber: ticket.ticketNumber,
      status: 'NO_SHOW',
    });

    await logAction({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'TOKEN_NO_SHOW',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber: ticket.ticketNumber },
    });

    res.status(200).json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} marked as NO-SHOW`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyStation,
  callNext,
  startService,
  completeService,
  skipTicket,
  markNoShow,
};
