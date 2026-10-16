const express = require('express');
const router = express.Router();
const {
  listCounters,
  createCounter,
  updateCounter,
  toggleCounterStatus,
} = require('../controllers/counterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', listCounters);
router.post('/', protect, authorize('admin'), createCounter);
router.put('/:id', protect, authorize('admin', 'staff'), updateCounter);
router.patch('/:id/status', protect, authorize('admin', 'staff'), toggleCounterStatus);

module.exports = router;
