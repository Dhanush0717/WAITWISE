const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (login/register) to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login/registration attempts from this IP, please try again after 15 minutes',
  },
});

// Rate limiter for ticket creation to prevent spam
const queueJoinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 queue joins per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many queue join requests, please wait a few moments before trying again',
  },
});

module.exports = { authLimiter, queueJoinLimiter };
