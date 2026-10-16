const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { calculateWaitTime } = require('../utils/predictionEngine');
const { logAction } = require('../utils/auditLogger');

// @desc    Get campus crowd overview & KPI dashboard metrics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardMetrics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      totalServices,
      activeServices,
      totalWaiting,
      totalServing,
      totalCounters,
      openCounters,
      todayCompleted,
      servicesList,
    ] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ status: 'active' }),
      Ticket.countDocuments({ status: 'WAITING' }),
      Ticket.countDocuments({ status: 'SERVING' }),
      Counter.countDocuments(),
      Counter.countDocuments({ status: { $in: ['open', 'busy'] } }),
      Ticket.countDocuments({ status: 'COMPLETED', completedAt: { $gte: todayStart } }),
      Service.find().sort({ name: 1 }),
    ]);

    // Service-by-service crowd metrics
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
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed queue analytics & historical trends
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    // 1. Status breakdown for today
    const outcomeAgg = await Ticket.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
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
      { $match: { createdAt: { $gte: todayStart } } },
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
      const h = i + 8; // 8am to 6pm
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
// @access  Private (Admin)
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

    // Simulated scenario
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
          'Simulated projection uses dynamic queue pacing and FIFO service assumptions. Actual performance depends on individual student inquiry complexity.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export tickets data as CSV
// @route   GET /api/admin/export-csv
// @access  Private (Admin)
const exportCSV = async (req, res, next) => {
  try {
    const tickets = await Ticket.find()
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
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all users (students, staff, admin)
// @route   GET /api/admin/users
// @access  Private (Admin)
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find()
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

// @desc    Create new staff or admin user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, identifier, phone, assignedService, assignedCounter } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'staff',
      identifier: identifier || '',
      phone: phone || '',
      assignedService: assignedService || null,
      assignedCounter: assignedCounter || null,
    });

    await logAction({
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
