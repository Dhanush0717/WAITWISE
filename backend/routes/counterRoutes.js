const express = require('express');
const router = express.Router();
const {
  listCounters,
  createCounter,
  updateCounter,
  toggleCounterStatus,
} = require('../controllers/counterController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');

router.get('/', listCounters);
router.post('/', optionalAuth, createCounter);
router.put('/:id', optionalAuth, updateCounter);
router.patch('/:id/status', optionalAuth, toggleCounterStatus);

module.exports = router;
