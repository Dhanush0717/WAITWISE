const express = require('express');
const router = express.Router();
const {
  listServices,
  getServiceDetails,
  createService,
  updateService,
  setServiceStatus,
  getServiceQR,
} = require('../controllers/serviceController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');

router.get('/', listServices);
router.get('/:id', getServiceDetails);
router.get('/:id/qr', getServiceQR);

router.post('/', optionalAuth, createService);
router.put('/:id', optionalAuth, updateService);
router.patch('/:id/status', optionalAuth, setServiceStatus);

module.exports = router;
