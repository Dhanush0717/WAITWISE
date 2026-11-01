const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - requires valid JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token missing',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'waitwise_super_secret_jwt_key_2026_campus_token'
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid or expired token',
    });
  }
};

// Optional auth - populates req.user if valid token present, but doesn't block if missing
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'waitwise_super_secret_jwt_key_2026_campus_token'
    );
    const user = await User.findById(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
};

// Role-Based Authorization
// Hierarchy & Aliases:
// super_admin > org_admin (admin) > branch_manager > staff > customer (student)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this operation',
      });
    }

    const userRole = req.user.role;

    // Super admin can access all org-level routes
    if (userRole === 'super_admin') {
      return next();
    }

    // Role equivalencies:
    const effectiveRoles = [userRole];
    if (userRole === 'admin') effectiveRoles.push('org_admin');
    if (userRole === 'org_admin') effectiveRoles.push('admin', 'branch_manager', 'staff');
    if (userRole === 'branch_manager') effectiveRoles.push('staff');
    if (userRole === 'student') effectiveRoles.push('customer');

    const hasPermission = roles.some((r) => effectiveRoles.includes(r));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Tenant isolation verification: ensures user only accesses resources belonging to their organization
const requireTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Super admin can access across tenants
  if (req.user.role === 'super_admin') {
    return next();
  }

  const userOrgId = req.user.organisationId ? String(req.user.organisationId) : null;
  const targetOrgId = req.params.orgId || req.body.organisationId || req.query.organisationId || req.headers['x-organisation-id'];

  if (targetOrgId && userOrgId && String(targetOrgId) !== userOrgId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Cannot access or modify data belonging to another organisation',
    });
  }

  req.tenantId = userOrgId;
  next();
};

module.exports = { protect, optionalAuth, authorize, requireTenant };
