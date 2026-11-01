const express = require('express');
const router = express.Router();
const {
  registerOrganisation,
  listOrganisations,
  getOrganisation,
  updateOrganisation,
  createBranch,
  listBranches,
} = require('../controllers/organisationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerOrganisation);
router.get('/', listOrganisations);
router.get('/:idOrSlug', getOrganisation);

router.put('/:id', protect, authorize('org_admin', 'super_admin'), updateOrganisation);
router.post('/:id/branches', protect, authorize('org_admin', 'super_admin'), createBranch);
router.get('/:id/branches', listBranches);

module.exports = router;
