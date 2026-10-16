const express = require('express');
const router = express.Router();
const {
  getMyStation,
  callNext,
  startService,
  completeService,
  skipTicket,
  markNoShow,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All staff routes require staff or admin role
router.use(protect, authorize('staff', 'admin'));

router.get('/my-station', getMyStation);
router.post('/call-next', callNext);
router.post('/start-service', startService);
router.post('/complete-service', completeService);
router.post('/skip', skipTicket);
router.post('/no-show', markNoShow);

module.exports = router;
