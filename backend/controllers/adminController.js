const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Organisation = require('../models/Organisation');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const { calculateWaitTime } = require('../utils/predictionEngine');
const { logAction } = require('../utils/auditLogger');

// Helper to get tenant filter based on user role and query
const getTenantFilter = (req) => {
  const filter = {};
  if (req.user && req.user.role !== 'super_admin' && req.user.organisationId) {
    filter.organisationId = req.user.organisationId;
  } else if (req.query.organisationId) {
    filter.organisationId = req.query.organisationId;
  }
  if (req.query.branchId) {
    filter.branchId = req.query.branchId;
  }
  return filter;
};

// @desc    Get organization crowd overview & KPI dashboard metrics
// @route   GET /api/admin/dashboard
// @access  Private (Org Admin, Branch Manager, Super Admin)
const getDashboardMetrics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const tenantFilter = getTenantFilter(req);

    const [
      totalServices,
      activeServices,
      totalWaiting,
      totalServing,
      totalCounters,
      openCounters,
      todayCompleted,
      servicesList,
      branchesList,
    ] = await Promise.all([
      Service.countDocuments(tenantFilter),
      Service.countDocuments({ ...tenantFilter, status: 'active' }),
      Ticket.countDocuments({ ...tenantFilter, status: 'WAITING' }),
      Ticket.countDocuments({ ...tenantFilter, status: 'SERVING' }),
      Counter.countDocuments(tenantFilter),
      Counter.countDocuments({ ...tenantFilter, status: { $in: ['open', 'busy'] } }),
      Ticket.countDocuments({
        ...tenantFilter,
        status: 'COMPLETED',
        completedAt: { $gte: todayStart },
      }),
      Service.find(tenantFilter).populate('branchId', 'name code').sort({ name: 1 }),
      tenantFilter.organisationId
        ? Branch.find({ organisationId: tenantFilter.organisationId }).sort({ name: 1 })
        : Branch.find().limit(20).sort({ name: 1 }),
    ]);

    let longestWaitMinutes = 0;
    let longestWaitService = 'None';

    const serviceSummaries = await Promise.all(
      servicesList.map(async (svc) => {
        const [waiting, serving, counters] = await Promise.all([
          Ticket.countDocuments({ serviceId: svc._id, status: 'WAITING' }),
          Ticket.countDocuments({ serviceId: svc._id, status: 'SERVING' }),
          Counter.countDocuments({ serviceId: svc._id, status: { $in: ['open', 'busy'] } }),
        ]);

        const waitInfo = await calculateWaitTime(svc._id, waiting);
        if (waitInfo.estimatedWaitMinutes > longestWaitMinutes) {
          longestWaitMinutes = waitInfo.estimatedWaitMinutes;
          longestWaitService = svc.name;
        }

        let loadLevel = 'low';
        if (waiting >= svc.overflowThreshold) {
          loadLevel = 'high';
        } else if (waiting >= Math.round(svc.overflowThreshold / 2)) {
          loadLevel = 'moderate';
        }

        return {
          id: svc._id,
          name: svc.name,
          code: svc.code,
          category: svc.category,
          status: svc.status,
          branch: svc.branchId ? svc.branchId.name : 'Main',
          waiting,
          serving,
          activeCounters: counters,
          estimatedWaitMinutes: waitInfo.estimatedWaitMinutes,
          overflowThreshold: svc.overflowThreshold,
          loadLevel,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        kpi: {
          totalServices,
          activeServices,
          totalWaiting,
          totalServing,
          totalCounters,
          openCounters,
          todayCompleted,
          longestWaitMinutes,
          longestWaitService,
        },
        services: serviceSummaries,
        branches: branchesList,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed queue analytics & historical trends
// @route   GET /api/admin/analytics
// @access  Private (Org Admin, Super Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const tenantFilter = getTenantFilter(req);

    // 1. Status breakdown for today
    const outcomeAgg = await Ticket.aggregate([
      { $match: { ...tenantFilter, createdAt: { $gte: todayStart } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const outcomes = {
      COMPLETED: 0,
      CANCELLED: 0,
      SKIPPED: 0,
      NO_SHOW: 0,
      WAITING: 0,
      SERVING: 0,
      CALLED: 0,
    };
    outcomeAgg.forEach((item) => {
      outcomes[item._id] = item.count;
    });

    const totalResolved =
      outcomes.COMPLETED + outcomes.CANCELLED + outcomes.SKIPPED + outcomes.NO_SHOW;
    const noShowRate =
      totalResolved > 0
        ? Math.round((outcomes.NO_SHOW / totalResolved) * 100)
        : 0;
    const cancelRate =
      totalResolved > 0
        ? Math.round((outcomes.CANCELLED / totalResolved) * 100)
        : 0;

    // 2. Average service duration per service for completed tickets today
    const durationPerService = await Ticket.aggregate([
      {
        $match: {
          ...tenantFilter,
          status: 'COMPLETED',
          completedAt: { $gte: todayStart },
          actualDurationMinutes: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$serviceId',
          avgDuration: { $avg: '$actualDurationMinutes' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      {
        $project: {
          serviceName: '$service.name',
          serviceCode: '$service.code',
          avgDuration: { $round: ['$avgDuration', 1] },
          count: 1,
        },
      },
    ]);

    // 3. Hourly traffic distribution today (08:00 to 18:00)
    const hourlyAgg = await Ticket.aggregate([
      { $match: { ...tenantFilter, createdAt: { $gte: todayStart } } },
      {
        $project: {
          hour: { $hour: '$createdAt' },
        },
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hourlyTraffic = Array.from({ length: 11 }, (_, i) => {
      const h = i + 8;
      const found = hourlyAgg.find((item) => item._id === h);
      return {
        hour: `${String(h).padStart(2, '0')}:00`,
        tokens: found ? found.count : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        outcomes,
        rates: {
          noShowRate,
          cancelRate,
        },
        durationPerService,
        hourlyTraffic,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate opening additional counters for a service
// @route   POST /api/admin/simulate-counter
// @access  Private (Org Admin, Super Admin)
const simulateCounter = async (req, res, next) => {
  try {
    const { serviceId, additionalCounters = 1 } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const waitingCount = await Ticket.countDocuments({
      serviceId: service._id,
      status: 'WAITING',
    });

    const activeCounters = await Counter.countDocuments({
      serviceId: service._id,
      status: { $in: ['open', 'busy'] },
    });

    const currentPrediction = await calculateWaitTime(service._id, waitingCount);

    const simulatedCounters = (activeCounters || 1) + Number(additionalCounters);
    const avgDuration = currentPrediction.avgServiceTimeMinutes || 5;

    const simulatedWaitMinutes = Math.max(
      1,
      Math.round((waitingCount / simulatedCounters) * avgDuration)
    );

    const timeSavedMinutes = Math.max(
      0,
      currentPrediction.estimatedWaitMinutes - simulatedWaitMinutes
    );

    const percentageReduction =
      currentPrediction.estimatedWaitMinutes > 0
        ? Math.round(
            (timeSavedMinutes / currentPrediction.estimatedWaitMinutes) * 100
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        serviceName: service.name,
        serviceCode: service.code,
        waitingCustomers: waitingCount,
        current: {
          activeCounters: activeCounters || 1,
          estimatedWaitMinutes: currentPrediction.estimatedWaitMinutes,
          minWaitMinutes: currentPrediction.minWaitMinutes,
          maxWaitMinutes: currentPrediction.maxWaitMinutes,
        },
        simulated: {
          additionalCounters: Number(additionalCounters),
          totalCounters: simulatedCounters,
          estimatedWaitMinutes: simulatedWaitMinutes,
          timeSavedMinutes,
          percentageReduction,
        },
        disclaimer:
          'Simulated projection uses dynamic queue pacing and FIFO service assumptions. Actual performance depends on individual customer inquiry complexity.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export tickets data as CSV (tenant scoped)
// @route   GET /api/admin/export-csv
// @access  Private (Org Admin, Super Admin)
const exportCSV = async (req, res, next) => {
  try {
    const tenantFilter = getTenantFilter(req);

    const tickets = await Ticket.find(tenantFilter)
      .populate('serviceId', 'name code')
      .populate('assignedCounter', 'counterNumber name')
      .sort({ createdAt: -1 })
      .limit(500);

    let csv = 'Ticket Number,Service,Status,Join Method,Joined At,Called At,Completed At,Duration (Mins),Customer\n';

    tickets.forEach((t) => {
      const svc = t.serviceId ? t.serviceId.name.replace(/,/g, '') : 'N/A';
      const joined = t.joinedAt ? new Date(t.joinedAt).toISOString() : '';
      const called = t.calledAt ? new Date(t.calledAt).toISOString() : '';
      const completed = t.completedAt ? new Date(t.completedAt).toISOString() : '';
      const cust = (t.customerName || '').replace(/,/g, '');

      csv += `"${t.ticketNumber}","${svc}","${t.status}","${t.joinMethod}","${joined}","${called}","${completed}",${t.actualDurationMinutes || 0},"${cust}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`waitwise-tickets-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Org Admin, Super Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const tenantFilter = getTenantFilter(req);
    const logs = await AuditLog.find(tenantFilter).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List users under organisation
// @route   GET /api/admin/users
// @access  Private (Org Admin, Super Admin)
const listUsers = async (req, res, next) => {
  try {
    const tenantFilter = getTenantFilter(req);
    const users = await User.find(tenantFilter)
      .populate('organisationId', 'name slug')
      .populate('branchId', 'name code')
      .populate('assignedService', 'name code')
      .populate('assignedCounter', 'counterNumber name')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new staff / manager user
// @route   POST /api/admin/users
// @access  Private (Org Admin, Super Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, identifier, phone, assignedService, assignedCounter, branchId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const orgId = req.user.role === 'super_admin' ? (req.body.organisationId || null) : req.user.organisationId;

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'staff',
      identifier: identifier || '',
      phone: phone || '',
      organisationId: orgId,
      branchId: branchId || req.user.branchId || null,
      assignedService: assignedService || null,
      assignedCounter: assignedCounter || null,
    });

    await logAction({
      organisationId: orgId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_CREATED',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getAnalytics,
  simulateCounter,
  exportCSV,
  getAuditLogs,
  listUsers,
  createUser,
};
