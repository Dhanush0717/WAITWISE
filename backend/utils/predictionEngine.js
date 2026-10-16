const Ticket = require('../models/Ticket');
const Counter = require('../models/Counter');
const Service = require('../models/Service');

/**
 * Calculate dynamic wait time prediction for a given service and position
 * @param {ObjectId} serviceId - The service ID
 * @param {Number} peopleAhead - Number of active WAITING tickets ahead
 * @returns {Promise<Object>} Detailed prediction breakdown
 */
const calculateWaitTime = async (serviceId, peopleAhead) => {
  const service = await Service.findById(serviceId);
  const defaultDuration = service ? service.estimatedServiceTimeMinutes : 5;

  // 1. Get active counters for this service (status in ['open', 'busy'])
  const activeCounters = await Counter.countDocuments({
    serviceId,
    status: { $in: ['open', 'busy'] },
  });

  const effectiveCounters = Math.max(1, activeCounters);

  // 2. Query historical service durations for this service today or past 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const completedTickets = await Ticket.find({
    serviceId,
    status: 'COMPLETED',
    completedAt: { $gte: oneDayAgo },
    actualDurationMinutes: { $gt: 0, $lte: 120 }, // filter realistic durations
  }).select('actualDurationMinutes');

  let avgServiceTimeMinutes = defaultDuration;
  let hasHistoricalData = false;

  if (completedTickets.length >= 3) {
    const totalMinutes = completedTickets.reduce(
      (acc, t) => acc + t.actualDurationMinutes,
      0
    );
    avgServiceTimeMinutes = Math.round((totalMinutes / completedTickets.length) * 10) / 10;
    hasHistoricalData = true;
  }

  // 3. Calculate expected wait: (peopleAhead / effectiveCounters) * avgServiceTime
  const rawWaitMinutes = Math.round((peopleAhead / effectiveCounters) * avgServiceTimeMinutes);
  const estimatedWaitMinutes = Math.max(0, rawWaitMinutes);

  // 4. Uncertainty range: +/- 20% or minimum +/- 2 minutes
  const margin = Math.max(2, Math.round(estimatedWaitMinutes * 0.2));
  const minWaitMinutes = Math.max(0, estimatedWaitMinutes - margin);
  const maxWaitMinutes = estimatedWaitMinutes + margin;

  return {
    estimatedWaitMinutes,
    minWaitMinutes,
    maxWaitMinutes,
    peopleAhead,
    activeCounters: effectiveCounters,
    avgServiceTimeMinutes,
    hasHistoricalData,
    assumptions: {
      basis: hasHistoricalData
        ? `Based on ${completedTickets.length} recent completed visits today (${avgServiceTimeMinutes} min/person)`
        : `Based on standard campus service baseline (${avgServiceTimeMinutes} min/person)`,
      countersActive: `${effectiveCounters} counter(s) actively operating`,
      disclaimer: 'This is a real-time dynamic estimate based on active queue pacing, not a guaranteed appointment.',
    },
  };
};

module.exports = { calculateWaitTime };
