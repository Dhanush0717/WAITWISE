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
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');
const { queueJoinLimiter } = require('../middleware/rateLimiter');

router.post('/join', queueJoinLimiter, optionalAuth, joinQueue);
router.post('/kiosk-join', queueJoinLimiter, kioskJoin);
router.post('/staff-issue', protect, authorize('staff', 'admin'), staffIssueToken);

router.get('/tickets/:id', getTicketStatus);
router.post('/tickets/:id/cancel', optionalAuth, cancelTicket);

router.get('/services/:id/live', getLiveQueue);
router.get('/my-history', protect, getMyTicketHistory);

module.exports = router;
