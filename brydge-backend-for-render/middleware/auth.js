const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

/**
 * Middleware to check if user is a rights holder
 */
const isRightsHolder = (req, res, next) => {
  if (req.user.userType !== 'rightsHolder') {
    return res.status(403).json({ error: 'Access denied. Rights holder role required.' });
  }
  next();
};

/**
 * Middleware to check if user is a musician
 */
const isMusician = (req, res, next) => {
  if (req.user.userType !== 'musician') {
    return res.status(403).json({ error: 'Access denied. Musician role required.' });
  }
  next();
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || 'mock-user-id', 
      email: user.email, 
      userType: user.userType 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare password with hashed password
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  authenticateToken,
  isRightsHolder,
  isMusician,
  generateToken,
  hashPassword,
  comparePassword
};
