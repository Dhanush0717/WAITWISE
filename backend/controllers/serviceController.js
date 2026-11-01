const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Ticket = require('../models/Ticket');
const { calculateWaitTime } = require('../utils/predictionEngine');
const { emitToService, emitToAdmin } = require('../sockets/socketHandler');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all services with live calculated queue stats (optionally filtered by organisation or branch)
// @route   GET /api/services
// @access  Public
const listServices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.organisationId) {
      filter.organisationId = req.query.organisationId;
    }
    if (req.query.branchId) {
      filter.branchId = req.query.branchId;
    }
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    const services = await Service.find(filter)
      .populate('organisationId', 'name slug type branding terminology')
      .populate('branchId', 'name code address')
      .sort({ name: 1 });

    const servicesWithStats = await Promise.all(
      services.map(async (service) => {
        const [waitingCount, servingCount, calledCount, activeCounters] =
          await Promise.all([
            Ticket.countDocuments({ serviceId: service._id, status: 'WAITING' }),
            Ticket.countDocuments({ serviceId: service._id, status: 'SERVING' }),
            Ticket.countDocuments({ serviceId: service._id, status: 'CALLED' }),
            Counter.countDocuments({
              serviceId: service._id,
              status: { $in: ['open', 'busy'] },
            }),
          ]);

        const waitInfo = await calculateWaitTime(service._id, waitingCount);

        let loadLevel = 'low'; // Green
        if (waitingCount >= service.overflowThreshold) {
          loadLevel = 'high'; // Red
        } else if (waitingCount >= Math.round(service.overflowThreshold / 2)) {
          loadLevel = 'moderate'; // Amber
        }

        return {
          ...service.toObject(),
          stats: {
            waitingCount,
            servingCount,
            calledCount,
            activeCounters,
            estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
            minWaitMinutes: waitInfo.minWaitMinutes,
            maxWaitMinutes: waitInfo.maxWaitMinutes,
            loadLevel,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: servicesWithStats.length,
      data: servicesWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service details with live counters & queue state
// @route   GET /api/services/:id
// @access  Public
const getServiceDetails = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('organisationId')
      .populate('branchId');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const [counters, waitingCount, servingTickets, calledTickets] =
      await Promise.all([
        Counter.find({ serviceId: service._id })
          .populate('assignedStaff', 'name email')
          .populate('currentTicket', 'ticketNumber customerName')
          .sort({ counterNumber: 1 }),
        Ticket.countDocuments({ serviceId: service._id, status: 'WAITING' }),
        Ticket.find({ serviceId: service._id, status: 'SERVING' })
          .populate('assignedCounter', 'counterNumber name')
          .sort({ serviceStartedAt: -1 }),
        Ticket.find({ serviceId: service._id, status: 'CALLED' })
          .populate('assignedCounter', 'counterNumber name')
          .sort({ calledAt: -1 }),
      ]);

    const waitInfo = await calculateWaitTime(service._id, waitingCount);

    res.status(200).json({
      success: true,
      data: {
        service,
        counters,
        queue: {
          waitingCount,
          servingCount: servingTickets.length,
          calledCount: calledTickets.length,
          servingTickets,
          calledTickets,
          prediction: waitInfo,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Org Admin, Super Admin)
const createService = async (req, res, next) => {
  try {
    const orgId = req.body.organisationId || (req.user ? req.user.organisationId : null);
    const branchId = req.body.branchId || (req.user ? req.user.branchId : null);

    const serviceData = {
      ...req.body,
      organisationId: orgId,
      branchId: branchId,
    };

    const service = await Service.create(serviceData);

    // Automatically create Counter 1 for this new service
    await Counter.create({
      organisationId: orgId,
      branchId: branchId,
      serviceId: service._id,
      counterNumber: 1,
      name: `${service.code} Station 1`,
      status: 'closed',
    });

    await logAction({
      organisationId: orgId,
      branchId: branchId,
      actorId: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : 'System',
      actorRole: req.user ? req.user.role : 'admin',
      action: 'SERVICE_CREATED',
      resourceType: 'Service',
      resourceId: service._id,
      metadata: { name: service.name, code: service.code },
    });

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service configuration
// @route   PUT /api/services/:id
// @access  Private (Org Admin, Super Admin)
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    emitToService(service._id, 'queueStatusChanged', {
      serviceId: service._id,
      status: service.status,
    });

    await logAction({
      organisationId: service.organisationId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'SERVICE_UPDATED',
      resourceType: 'Service',
      resourceId: service._id,
      metadata: req.body,
    });

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set service operating status ('active', 'paused', 'closed')
// @route   PATCH /api/services/:id/status
// @access  Private (Org Admin, Branch Manager, Staff)
const setServiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, paused, or closed.',
      });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    emitToService(service._id, 'queueStatusChanged', {
      serviceId: service._id,
      status,
    });

    await logAction({
      organisationId: service.organisationId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `SERVICE_STATUS_${status.toUpperCase()}`,
      resourceType: 'Service',
      resourceId: service._id,
    });

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get QR payload and metadata for printing/displaying at service entrance
// @route   GET /api/services/:id/qr
// @access  Public
const getServiceQR = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('organisationId')
      .populate('branchId');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const host = process.env.CLIENT_URL || 'http://localhost:4200';
    const joinUrl = `${host}/services/${service._id}/join?key=${service.qrJoinKey}`;

    res.status(200).json({
      success: true,
      data: {
        serviceId: service._id,
        serviceName: service.name,
        serviceCode: service.code,
        organisation: service.organisationId,
        branch: service.branchId,
        location: service.location,
        joinUrl,
        qrJoinKey: service.qrJoinKey,
        instructions: 'Scan with smartphone camera to take a virtual queue token.',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listServices,
  getServiceDetails,
  createService,
  updateService,
  setServiceStatus,
  getServiceQR,
};
