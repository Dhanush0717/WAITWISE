const Organisation = require('../models/Organisation');
const Branch = require('../models/Branch');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');
const { logAction } = require('../utils/auditLogger');

// Industry terminology defaults helper
const getTerminologyForType = (type) => {
  const dictionary = {
    healthcare: {
      visitorLabel: 'Patient',
      operatorLabel: 'Doctor / Triage Nurse',
      serviceLabel: 'Clinic / Department',
      stationLabel: 'Consultation Room / Bay',
      identifierLabel: 'Patient ID / MRN',
    },
    banking: {
      visitorLabel: 'Customer',
      operatorLabel: 'Teller / Loan Officer',
      serviceLabel: 'Banking Desk',
      stationLabel: 'Counter / Window',
      identifierLabel: 'Account / CIF Number',
    },
    government: {
      visitorLabel: 'Citizen',
      operatorLabel: 'Public Officer',
      serviceLabel: 'Public Service Desk',
      stationLabel: 'Service Window',
      identifierLabel: 'Application Ref Number',
    },
    corporate: {
      visitorLabel: 'Visitor / Guest',
      operatorLabel: 'Host / Receptionist',
      serviceLabel: 'Facility Service',
      stationLabel: 'Reception Desk',
      identifierLabel: 'Visitor Pass ID',
    },
    retail: {
      visitorLabel: 'Customer / Client',
      operatorLabel: 'Service Specialist',
      serviceLabel: 'Service Category',
      stationLabel: 'Service Bay',
      identifierLabel: 'Order / Invoice Number',
    },
    education: {
      visitorLabel: 'Student',
      operatorLabel: 'Desk Staff',
      serviceLabel: 'Campus Desk',
      stationLabel: 'Service Counter',
      identifierLabel: 'Student ID / Roll No',
    },
    hospitality: {
      visitorLabel: 'Guest',
      operatorLabel: 'Front Desk Host',
      serviceLabel: 'Guest Service',
      stationLabel: 'Desk Station',
      identifierLabel: 'Booking Ref Number',
    },
  };

  return dictionary[type] || dictionary.corporate;
};

// @desc    Create / Onboard an organisation
// @route   POST /api/organisations
// @access  Public / Optional Auth
const createOrganisation = async (req, res, next) => {
  try {
    const { name, type, description, contact, terminology, branding } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Organisation name is required' });
    }

    let slug = (req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).toLowerCase();
    
    // Ensure slug uniqueness
    const existing = await Organisation.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const defaultTerminology = getTerminologyForType(type || 'corporate');
    const finalTerminology = terminology ? { ...defaultTerminology, ...terminology } : defaultTerminology;

    const organisation = await Organisation.create({
      name: name.trim(),
      slug,
      type: type || 'corporate',
      description: description || '',
      contact: contact || {},
      terminology: finalTerminology,
      branding: branding || {},
      status: 'active'
    });

    // Create an initial default branch so services have a home immediately
    const branchName = req.body.branchName || 'Main Facility Branch';
    // Make branch code unique by appending short random suffix if not provided
    const rawCode = (req.body.branchCode || 'MAIN').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const branchCode = rawCode + '-' + Date.now().toString(36).toUpperCase().slice(-4);
    const branch = await Branch.create({
      organisationId: organisation._id,
      name: branchName,
      code: branchCode,
      address: req.body.branchAddress || {},
      status: 'active'
    });

    // Create a starter service desk so the new organization has an active desk ready to queue immediately
    const starterService = await Service.create({
      organisationId: organisation._id,
      branchId: branch._id,
      name: `${organisation.name} Intake Desk`,
      code: 'MAIN',
      prefix: 'A',
      category: 'General',
      description: `Primary intake desk for ${organisation.name}`,
      avgServiceDuration: 5,
      status: 'active',
      isSelfJoinEnabled: true,
      isKioskEnabled: true
    });

    await Counter.create({
      organisationId: organisation._id,
      branchId: branch._id,
      serviceId: starterService._id,
      counterNumber: 1,
      name: 'Station 1',
      status: 'open'
    });

    await logAction({
      organisationId: organisation._id,
      branchId: branch._id,
      actorId: req.user ? req.user._id : null,
      actorName: req.user ? req.user.name : 'System',
      actorRole: req.user ? req.user.role : 'admin',
      action: 'ORGANISATION_CREATED',
      resourceType: 'Organisation',
      resourceId: organisation._id,
      metadata: { name: organisation.name, type: organisation.type },
    });

    res.status(201).json({
      success: true,
      data: organisation,
      branch,
      service: starterService
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new organisation and create primary administrator
// @route   POST /api/organisations/register
// @access  Public
const registerOrganisation = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      type,
      description,
      contact,
      adminName,
      adminEmail,
      adminPassword,
      branchName,
      branchCode,
      branchAddress,
    } = req.body;

    if (!name || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({
        success: false,
        message: 'Organisation name, admin name, email, and password are required',
      });
    }

    const orgSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).toLowerCase();

    // Check slug uniqueness
    const existingOrg = await Organisation.findOne({ slug: orgSlug });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'An organisation with this name or slug already exists',
      });
    }

    // Check admin email uniqueness
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this administrator email already exists',
      });
    }

    const terminology = getTerminologyForType(type || 'corporate');

    // 1. Create Organisation
    const organisation = await Organisation.create({
      name,
      slug: orgSlug,
      type: type || 'corporate',
      description: description || '',
      contact: contact || { email: adminEmail },
      terminology,
    });

    // 2. Create Initial Main Branch
    const rawBranchCode = (branchCode || 'MAIN').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const finalBranchCode = rawBranchCode + '-' + Date.now().toString(36).toUpperCase().slice(-4);
    const branch = await Branch.create({
      organisationId: organisation._id,
      name: branchName || 'Main Branch',
      code: finalBranchCode,
      address: branchAddress || {},
      status: 'active',
    });

    // 3. Create Org Admin User
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: 'org_admin',
      organisationId: organisation._id,
      branchId: branch._id,
    });

    const token = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET || 'waitwise_super_secret_jwt_key_2026_campus_token',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    await logAction({
      organisationId: organisation._id,
      branchId: branch._id,
      actorId: adminUser._id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'ORGANISATION_REGISTERED',
      resourceType: 'Organisation',
      resourceId: organisation._id,
      metadata: { name: organisation.name, type: organisation.type },
    });

    res.status(201).json({
      success: true,
      message: 'Organisation successfully onboarded!',
      token,
      data: {
        organisation,
        branch,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          organisationId: organisation._id,
          branchId: branch._id,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all organisations (for directory / industry template switcher)
// @route   GET /api/organisations
// @access  Public
const listOrganisations = async (req, res, next) => {
  try {
    const organisations = await Organisation.find({ status: 'active' }).sort({ name: 1 });

    const orgsWithCounts = await Promise.all(
      organisations.map(async (org) => {
        const [branchCount, serviceCount, waitingCount] = await Promise.all([
          Branch.countDocuments({ organisationId: org._id }),
          Service.countDocuments({ organisationId: org._id }),
          Ticket.countDocuments({ organisationId: org._id, status: 'WAITING' }),
        ]);

        return {
          ...org.toObject(),
          stats: {
            branches: branchCount,
            services: serviceCount,
            activeWaiting: waitingCount,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: orgsWithCounts.length,
      data: orgsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organisation details by ID or Slug
// @route   GET /api/organisations/:idOrSlug
// @access  Public
const getOrganisation = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let query = {};
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug.toLowerCase() };
    }

    const organisation = await Organisation.findOne(query);
    if (!organisation) {
      return res.status(404).json({ success: false, message: 'Organisation not found' });
    }

    const branches = await Branch.find({ organisationId: organisation._id, status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        organisation,
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update organisation profile, branding, and terminology
// @route   PUT /api/organisations/:id
// @access  Private (Org Admin or Super Admin)
const updateOrganisation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tenant check: Org admin can only update their own organization
    if (req.user.role !== 'super_admin' && String(req.user.organisationId) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this organisation' });
    }

    const organisation = await Organisation.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!organisation) {
      return res.status(404).json({ success: false, message: 'Organisation not found' });
    }

    res.status(200).json({
      success: true,
      data: organisation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new branch under an organisation
// @route   POST /api/organisations/:id/branches
// @access  Private / Optional Auth
const createBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.role !== 'super_admin' && req.user.organisationId && String(req.user.organisationId) !== String(id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this organisation' });
    }

    const { name, code, address, coordinates, phone, operatingHours } = req.body;

    const branch = await Branch.create({
      organisationId: id,
      name: name || 'Main Center',
      code: code ? code.toUpperCase() : 'BR',
      address: address || {},
      coordinates: coordinates || { lat: 28.545, lng: 77.192 },
      phone: phone || '',
      operatingHours: operatingHours || {},
      status: 'active',
    });

    res.status(201).json({
      success: true,
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List branches for an organisation
// @route   GET /api/organisations/:id/branches
// @access  Public
const listBranches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const branches = await Branch.find({ organisationId: id }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganisation,
  registerOrganisation,
  listOrganisations,
  getOrganisation,
  updateOrganisation,
  createBranch,
  listBranches,
};
