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
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', listServices);
router.get('/:id', getServiceDetails);
router.get('/:id/qr', getServiceQR);

router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);
router.patch('/:id/status', protect, authorize('admin', 'staff'), setServiceStatus);

module.exports = router;
