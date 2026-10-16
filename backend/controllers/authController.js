const User = require('../models/User');
const Ticket = require('../models/Ticket');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'waitwise_super_secret_jwt_key_2026_campus_token',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

// @desc    Register a new user (Student by default)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, identifier, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Security rule: Never allow regular register API to grant administrator privileges
    const assignedRole = role === 'admin' ? 'student' : (role || 'student');

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      identifier: identifier || '',
      phone: phone || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        identifier: user.identifier,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('assignedService')
      .populate('assignedCounter');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended. Please contact administrator.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        identifier: user.identifier,
        assignedService: user.assignedService,
        assignedCounter: user.assignedCounter,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user & active ticket
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('assignedService')
      .populate('assignedCounter');

    // Find any active ticket owned by this user (WAITING, CALLED, or SERVING)
    const activeTicket = await Ticket.findOne({
      userId: user._id,
      status: { $in: ['WAITING', 'CALLED', 'SERVING'] },
    })
      .populate('serviceId', 'name code location estimatedServiceTimeMinutes status')
      .populate('assignedCounter', 'counterNumber name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user,
      activeTicket,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
