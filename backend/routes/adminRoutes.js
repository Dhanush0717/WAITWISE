const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getAnalytics,
  simulateCounter,
  exportCSV,
  getAuditLogs,
  listUsers,
  createUser,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes strictly require admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardMetrics);
router.get('/analytics', getAnalytics);
router.post('/simulate-counter', simulateCounter);
router.get('/export-csv', exportCSV);
router.get('/audit-logs', getAuditLogs);
router.get('/users', listUsers);
router.post('/users', createUser);

module.exports = router;
