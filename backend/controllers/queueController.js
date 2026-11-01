const Ticket = require('../models/Ticket');
const Service = require('../models/Service');
const QueueSession = require('../models/QueueSession');
const Notification = require('../models/Notification');
const { calculateWaitTime } = require('../utils/predictionEngine');
const { emitToService, emitToTicket, emitToUser, emitToAdmin } = require('../sockets/socketHandler');
const { logAction } = require('../utils/auditLogger');
const { v4: uuidv4 } = require('uuid');

// Helper to get or create active queue session for today
const getOrCreateTodaySession = async (service) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let session = await QueueSession.findOne({ serviceId: service._id, sessionDate: today });

  if (!session) {
    session = await QueueSession.create({
      organisationId: service.organisationId,
      branchId: service.branchId,
      serviceId: service._id,
      sessionDate: today,
      tokenSequence: 0,
      status: 'active',
    });
  }
  return session;
};

// Helper: atomic sequential token generation
const generateNextToken = async (service, session) => {
  const updatedSession = await QueueSession.findOneAndUpdate(
    { _id: session._id },
    { $inc: { tokenSequence: 1, totalTokensIssued: 1 } },
    { new: true }
  );

  const seq = updatedSession.tokenSequence;
  const formattedSeq = String(seq).padStart(3, '0');
  const ticketNumber = `${service.code}-${formattedSeq}`;

  return { ticketNumber, sequenceNumber: seq, session: updatedSession };
};

// @desc    Join queue (Self-service via web or QR code)
// @route   POST /api/queues/join
// @access  Public / Optional Authenticated
const joinQueue = async (req, res, next) => {
  try {
    const { serviceId, customerName, customerIdentifier, qrKey } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'serviceId is required' });
    }

    const service = await Service.findById(serviceId).populate('organisationId');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `This service is currently ${service.status}. Queuing is not available right now.`,
      });
    }

    if (!service.isSelfJoinEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Self-service queuing is disabled for this desk. Please use the kiosk or ask staff.',
      });
    }

    // Check maximum queue capacity
    const activeWaitingCount = await Ticket.countDocuments({
      serviceId: service._id,
      status: 'WAITING',
    });

    if (activeWaitingCount >= service.maxQueueCapacity) {
      return res.status(400).json({
        success: false,
        message: `Queue capacity limit reached (${service.maxQueueCapacity} people). Please try again shortly.`,
      });
    }

    const userId = req.user ? req.user._id : null;

    // Prevent duplicate active token for logged-in user in same service
    if (userId) {
      const existingActiveTicket = await Ticket.findOne({
        serviceId: service._id,
        userId,
        status: { $in: ['WAITING', 'CALLED', 'SERVING'] },
      });

      if (existingActiveTicket) {
        return res.status(400).json({
          success: false,
          message: `You already hold active token ${existingActiveTicket.ticketNumber} for this service.`,
          existingTicketId: existingActiveTicket._id,
        });
      }
    }

    const session = await getOrCreateTodaySession(service);
    const { ticketNumber, sequenceNumber } = await generateNextToken(service, session);

    const guestAccessToken = !userId ? uuidv4() : null;
    const finalCustomerName =
      customerName ||
      (req.user ? req.user.name : `Visitor #${sequenceNumber}`);

    const finalIdentifier =
      customerIdentifier || (req.user ? req.user.identifier : '');

    const ticket = await Ticket.create({
      ticketNumber,
      sequenceNumber,
      organisationId: service.organisationId ? service.organisationId._id : null,
      branchId: service.branchId,
      serviceId: service._id,
      queueSessionId: session._id,
      userId,
      customerName: finalCustomerName,
      customerIdentifier: finalIdentifier,
      joinMethod: qrKey ? 'qr_mobile' : 'web_portal',
      status: 'WAITING',
      guestAccessToken,
    });

    // Create confirmation in-app notification
    await Notification.create({
      organisationId: service.organisationId ? service.organisationId._id : null,
      recipient: userId,
      guestToken: guestAccessToken,
      ticketId: ticket._id,
      title: `Token Issued: ${ticketNumber}`,
      message: `You joined ${service.name} queue. Your token is ${ticketNumber}.`,
      type: 'ticket_created',
    });

    // Calculate wait estimate
    const waitInfo = await calculateWaitTime(service._id, activeWaitingCount);

    // Emit real-time events
    emitToService(service._id, 'tokenCreated', {
      ticketNumber: ticket.ticketNumber,
      sequenceNumber: ticket.sequenceNumber,
      serviceId: service._id,
      organisationId: service.organisationId ? service.organisationId._id : null,
      activeWaitingCount: activeWaitingCount + 1,
    });

    emitToService(service._id, 'queueUpdated', {
      serviceId: service._id,
      organisationId: service.organisationId ? service.organisationId._id : null,
      waitingCount: activeWaitingCount + 1,
    });

    // Check for overflow alert
    if (activeWaitingCount + 1 >= service.overflowThreshold) {
      emitToAdmin('overload_alert', {
        serviceId: service._id,
        serviceName: service.name,
        organisationId: service.organisationId ? service.organisationId._id : null,
        waitingCount: activeWaitingCount + 1,
        threshold: service.overflowThreshold,
        recommendation: 'Recommend opening an additional counter to alleviate queue pressure.',
      });
    }

    await logAction({
      organisationId: service.organisationId ? service.organisationId._id : null,
      branchId: service.branchId,
      actorId: userId,
      actorName: finalCustomerName,
      actorRole: req.user ? req.user.role : 'guest',
      action: 'TICKET_CREATED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber, joinMethod: ticket.joinMethod },
    });

    res.status(201).json({
      success: true,
      data: {
        ticket,
        guestAccessToken,
        position: activeWaitingCount + 1,
        peopleAhead: activeWaitingCount,
        estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
        prediction: waitInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue token via Kiosk Terminal
// @route   POST /api/queues/kiosk-join
// @access  Public
const kioskJoin = async (req, res, next) => {
  try {
    const { serviceId, customerName, customerIdentifier } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'serviceId is required' });
    }

    const service = await Service.findById(serviceId).populate('organisationId');
    if (!service || service.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This service is currently not active for kiosk ticketing',
      });
    }

    const session = await getOrCreateTodaySession(service);
    const { ticketNumber, sequenceNumber } = await generateNextToken(service, session);

    const guestAccessToken = uuidv4();
    const activeWaitingCount = await Ticket.countDocuments({
      serviceId: service._id,
      status: 'WAITING',
    });

    const ticket = await Ticket.create({
      ticketNumber,
      sequenceNumber,
      organisationId: service.organisationId ? service.organisationId._id : null,
      branchId: service.branchId,
      serviceId: service._id,
      queueSessionId: session._id,
      userId: null,
      customerName: customerName || `Walk-in Guest #${sequenceNumber}`,
      customerIdentifier: customerIdentifier || '',
      joinMethod: 'kiosk',
      status: 'WAITING',
      guestAccessToken,
    });

    const waitInfo = await calculateWaitTime(service._id, activeWaitingCount);

    emitToService(service._id, 'tokenCreated', {
      ticketNumber: ticket.ticketNumber,
      sequenceNumber: ticket.sequenceNumber,
      serviceId: service._id,
      organisationId: service.organisationId ? service.organisationId._id : null,
      activeWaitingCount: activeWaitingCount + 1,
    });

    emitToService(service._id, 'queueUpdated', {
      serviceId: service._id,
      organisationId: service.organisationId ? service.organisationId._id : null,
      waitingCount: activeWaitingCount + 1,
    });

    await logAction({
      organisationId: service.organisationId ? service.organisationId._id : null,
      branchId: service.branchId,
      actorName: 'Kiosk Terminal',
      actorRole: 'kiosk',
      action: 'KIOSK_TICKET_ISSUED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber },
    });

    res.status(201).json({
      success: true,
      data: {
        ticket,
        guestAccessToken,
        position: activeWaitingCount + 1,
        peopleAhead: activeWaitingCount,
        estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
        trackingUrl: `${process.env.CLIENT_URL || 'http://localhost:4200'}/tickets/${ticket._id}?guestToken=${guestAccessToken}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff-assisted token issuance for walk-in visitors without smartphones
// @route   POST /api/queues/staff-issue
// @access  Private (Staff, Branch Manager, Org Admin, Super Admin)
const staffIssueToken = async (req, res, next) => {
  try {
    const { serviceId, customerName, customerIdentifier, notes } = req.body;

    const targetServiceId = serviceId || req.user.assignedService;
    if (!targetServiceId) {
      return res.status(400).json({ success: false, message: 'Target serviceId is required' });
    }

    const service = await Service.findById(targetServiceId).populate('organisationId');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const session = await getOrCreateTodaySession(service);
    const { ticketNumber, sequenceNumber } = await generateNextToken(service, session);

    const guestAccessToken = uuidv4();
    const activeWaitingCount = await Ticket.countDocuments({
      serviceId: service._id,
      status: 'WAITING',
    });

    const ticket = await Ticket.create({
      ticketNumber,
      sequenceNumber,
      organisationId: service.organisationId ? service.organisationId._id : null,
      branchId: service.branchId,
      serviceId: service._id,
      queueSessionId: session._id,
      userId: null,
      customerName: customerName || `Assisted Visitor #${sequenceNumber}`,
      customerIdentifier: customerIdentifier || '',
      joinMethod: 'staff_assisted',
      status: 'WAITING',
      guestAccessToken,
    });

    const waitInfo = await calculateWaitTime(service._id, activeWaitingCount);

    emitToService(service._id, 'tokenCreated', {
      ticketNumber: ticket.ticketNumber,
      sequenceNumber: ticket.sequenceNumber,
      serviceId: service._id,
      organisationId: service.organisationId ? service.organisationId._id : null,
      activeWaitingCount: activeWaitingCount + 1,
    });

    emitToService(service._id, 'queueUpdated', {
      serviceId: service._id,
      organisationId: service.organisationId ? service.organisationId._id : null,
      waitingCount: activeWaitingCount + 1,
    });

    await logAction({
      organisationId: service.organisationId ? service.organisationId._id : null,
      branchId: service.branchId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'STAFF_ASSISTED_TICKET_ISSUED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber, assistedBy: req.user.name, notes },
    });

    res.status(201).json({
      success: true,
      data: {
        ticket,
        guestAccessToken,
        position: activeWaitingCount + 1,
        peopleAhead: activeWaitingCount,
        estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed ticket status by ID or guest access token
// @route   GET /api/queues/tickets/:id
// @access  Public
const getTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { guestToken } = req.query;

    let query = { _id: id };
    if (guestToken) {
      query = { guestAccessToken: guestToken };
    }

    const ticket = await Ticket.findOne(query)
      .populate({
        path: 'serviceId',
        populate: [{ path: 'organisationId' }, { path: 'branchId' }],
      })
      .populate('assignedCounter', 'counterNumber name status')
      .populate('servedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let peopleAhead = 0;
    let queuePosition = 1;

    if (ticket.status === 'WAITING') {
      peopleAhead = await Ticket.countDocuments({
        serviceId: ticket.serviceId._id,
        status: 'WAITING',
        sequenceNumber: { $lt: ticket.sequenceNumber },
      });
      queuePosition = peopleAhead + 1;
    }

    const currentlyServing = await Ticket.findOne({
      serviceId: ticket.serviceId._id,
      status: 'SERVING',
    })
      .populate('assignedCounter', 'counterNumber name')
      .sort({ serviceStartedAt: -1 });

    const waitInfo = await calculateWaitTime(ticket.serviceId._id, peopleAhead);

    res.status(200).json({
      success: true,
      data: {
        ticket,
        peopleAhead,
        queuePosition,
        prediction: waitInfo,
        currentlyServing: currentlyServing
          ? {
              ticketNumber: currentlyServing.ticketNumber,
              counterName: currentlyServing.assignedCounter
                ? currentlyServing.assignedCounter.name
                : 'Counter',
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel ticket (by user or staff)
// @route   POST /api/queues/tickets/:id/cancel
// @access  Public (Owner or Guest with token or Staff)
const cancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { guestToken, reason } = req.body;

    const ticket = await Ticket.findById(id).populate('serviceId');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(ticket.status)) {
      return res.status(400).json({
        success: false,
        message: `Ticket is already in ${ticket.status} state`,
      });
    }

    const isUserOwner = req.user && ticket.userId && String(req.user._id) === String(ticket.userId);
    const isGuestOwner = guestToken && ticket.guestAccessToken === guestToken;
    const isStaffOrAdmin = req.user && ['staff', 'branch_manager', 'org_admin', 'admin', 'super_admin'].includes(req.user.role);

    if (!isUserOwner && !isGuestOwner && !isStaffOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this ticket',
      });
    }

    ticket.status = 'CANCELLED';
    ticket.skipReason = reason || 'Cancelled by visitor';
    await ticket.save();

    const remainingWaiting = await Ticket.countDocuments({
      serviceId: ticket.serviceId._id,
      status: 'WAITING',
    });

    emitToService(ticket.serviceId._id, 'tokenCancelled', {
      ticketNumber: ticket.ticketNumber,
      serviceId: ticket.serviceId._id,
      remainingWaiting,
    });

    emitToService(ticket.serviceId._id, 'queueUpdated', {
      serviceId: ticket.serviceId._id,
      waitingCount: remainingWaiting,
    });

    emitToTicket(ticket._id, 'tokenCancelled', {
      ticketNumber: ticket.ticketNumber,
      status: 'CANCELLED',
    });

    await logAction({
      organisationId: ticket.organisationId,
      branchId: ticket.branchId,
      actorId: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : ticket.customerName,
      actorRole: req.user ? req.user.role : 'guest',
      action: 'TICKET_CANCELLED',
      resourceType: 'Ticket',
      resourceId: ticket._id,
      metadata: { ticketNumber: ticket.ticketNumber, reason },
    });

    res.status(200).json({
      success: true,
      message: 'Ticket successfully cancelled',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authoritative live queue state for a service
// @route   GET /api/queues/services/:id/live
// @access  Public
const getLiveQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).populate('organisationId');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const [waitingTickets, calledTickets, servingTickets, activeCounters] =
      await Promise.all([
        Ticket.find({ serviceId: service._id, status: 'WAITING' })
          .select('ticketNumber sequenceNumber customerName joinedAt')
          .sort({ sequenceNumber: 1 })
          .limit(50),
        Ticket.find({ serviceId: service._id, status: 'CALLED' })
          .populate('assignedCounter', 'counterNumber name')
          .sort({ calledAt: -1 }),
        Ticket.find({ serviceId: service._id, status: 'SERVING' })
          .populate('assignedCounter', 'counterNumber name')
          .sort({ serviceStartedAt: -1 }),
        Counter.countDocuments({
          serviceId: service._id,
          status: { $in: ['open', 'busy'] },
        }),
      ]);

    const waitInfo = await calculateWaitTime(service._id, waitingTickets.length);

    res.status(200).json({
      success: true,
      data: {
        serviceId: service._id,
        serviceName: service.name,
        serviceStatus: service.status,
        organisation: service.organisationId,
        counts: {
          waiting: waitingTickets.length,
          called: calledTickets.length,
          serving: servingTickets.length,
          activeCounters,
        },
        waitingTickets: waitingTickets.map((t, idx) => ({
          ticketNumber: t.ticketNumber,
          position: idx + 1,
          customerName: t.customerName.length > 4 ? `${t.customerName.substring(0, 3)}***` : t.customerName,
          joinedAt: t.joinedAt,
        })),
        calledTickets,
        servingTickets,
        prediction: waitInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's ticket history
// @route   GET /api/queues/my-history
// @access  Private
const getMyTicketHistory = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id })
      .populate('serviceId', 'name code location')
      .populate('assignedCounter', 'counterNumber name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  joinQueue,
  kioskJoin,
  staffIssueToken,
  getTicketStatus,
  cancelTicket,
  getLiveQueue,
  getMyTicketHistory,
};
