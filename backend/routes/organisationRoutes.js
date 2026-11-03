const express = require('express');
const router = express.Router();
const {
  createOrganisation,
  registerOrganisation,
  listOrganisations,
  getOrganisation,
  updateOrganisation,
  createBranch,
  listBranches,
} = require('../controllers/organisationController');
const { protect, optionalAuth, authorize } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, createOrganisation);
router.post('/register', registerOrganisation);
router.get('/', listOrganisations);
router.get('/:idOrSlug', getOrganisation);

router.put('/:id', optionalAuth, updateOrganisation);
router.post('/:id/branches', optionalAuth, createBranch);
router.get('/:id/branches', listBranches);

module.exports = router;
