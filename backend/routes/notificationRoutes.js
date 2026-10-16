const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { optionalAuth, protect } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', protect, markAllAsRead);

module.exports = router;
