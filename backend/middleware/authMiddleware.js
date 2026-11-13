const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !/^Bearer\s+/i.test(header)) return null;
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token && token !== 'null' && token !== 'undefined' ? token : null;
};

const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  try {
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    return res.status(503).json({ message: 'Authentication service unavailable. Please try again shortly.' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'User not found' });
  }
  return next();
};

/**
 * Attach req.user when a valid token is supplied, otherwise continue as a guest.
 * An expired/invalid token on a public route must not block guests.
 */
const optionalProtect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.id).select('-password');
    if (user) req.user = user;
  } catch (error) {
    // proceed as guest
  }
  return next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res
      .status(403)
      .json({ message: `Role ${req.user ? req.user.role : 'none'} is not authorized to access this resource` });
  };
};

module.exports = { protect, optionalProtect, authorize };
