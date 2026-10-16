const Notification = require('../models/Notification');

// @desc    Get user or guest notifications
// @route   GET /api/notifications?guestToken=xxx
// @access  Public / Optional Auth
const getNotifications = async (req, res, next) => {
  try {
    const { guestToken } = req.query;
    const filter = {};

    if (req.user) {
      filter.recipient = req.user._id;
    } else if (guestToken) {
      filter.guestToken = guestToken;
    } else {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Public / Auth
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
