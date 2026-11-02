const express = require('express');
const router = express.Router();
const {
  joinQueue,
  kioskJoin,
  staffIssueToken,
  getTicketStatus,
  cancelTicket,
  getLiveQueue,
  getMyTicketHistory,
} = require('../controllers/queueController');
const {
  callNext,
  startService,
  completeService,
  skipTicket,
  markNoShow,
} = require('../controllers/staffController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');
const { queueJoinLimiter } = require('../middleware/rateLimiter');

router.post('/join', queueJoinLimiter, optionalAuth, joinQueue);
router.post('/kiosk-join', queueJoinLimiter, kioskJoin);
router.post('/staff-issue', protect, authorize('staff', 'admin'), staffIssueToken);

router.get('/tickets/:id', getTicketStatus);
router.get('/ticket/:id', getTicketStatus);
router.post('/tickets/:id/cancel', optionalAuth, cancelTicket);
router.post('/cancel/:id', optionalAuth, cancelTicket);

router.get('/services/:id/live', getLiveQueue);
router.get('/live/:id', getLiveQueue);
router.get('/my-history', protect, getMyTicketHistory);

// Direct route aliases for counter actions
router.post('/counter/:id/call-next', protect, authorize('staff', 'admin'), (req, res, next) => {
  req.body.counterId = req.params.id;
  return callNext(req, res, next);
});
router.post('/serve/:id', protect, authorize('staff', 'admin'), (req, res, next) => {
  req.body.ticketId = req.params.id;
  return startService(req, res, next);
});
router.post('/complete/:id', protect, authorize('staff', 'admin'), (req, res, next) => {
  req.body.ticketId = req.params.id;
  return completeService(req, res, next);
});
router.post('/skip/:id', protect, authorize('staff', 'admin'), (req, res, next) => {
  req.body.ticketId = req.params.id;
  return skipTicket(req, res, next);
});
router.post('/no-show/:id', protect, authorize('staff', 'admin'), (req, res, next) => {
  req.body.ticketId = req.params.id;
  return markNoShow(req, res, next);
});

module.exports = router;
