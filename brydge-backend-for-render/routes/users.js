const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { 
  authenticateToken, 
  generateToken, 
  hashPassword, 
  comparePassword 
} = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;
    
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!['musician', 'rightsHolder'].includes(userType)) {
      return res.status(400).json({ error: 'User type must be either musician or rightsHolder' });
    }
    
    if (process.env.ENABLE_DB === 'true') {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create new user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        userType
      });
      
      await user.save();
      
      // Create and return JWT token
      const token = generateToken(user);
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          userType: user.userType
        }
      });
    } else {
      // Mock response when database is not enabled
      const token = generateToken({
        _id: 'mock-user-id',
        email,
        userType
      });
      
      res.status(201).json({
        message: 'User registered successfully (mock)',
        token,
        user: {
          id: 'mock-user-id',
          email,
          name,
          userType
        }
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (process.env.ENABLE_DB === 'true') {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Create and return JWT token
      const token = generateToken(user);
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          userType: user.userType
        }
      });
    } else {
      // Mock response when database is not enabled
      const mockUser = {
        _id: 'mock-user-id',
        email,
        userType: 'musician',
        name: 'Mock User'
      };
      
      const token = generateToken(mockUser);
      
      res.json({
        message: 'Login successful (mock)',
        token,
        user: {
          id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
          userType: mockUser.userType
        }
      });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      // Find user by ID
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } else {
      // Mock response when database is not enabled
      res.json({
        id: req.user.id,
        email: req.user.email,
        name: 'Mock User',
        userType: req.user.userType || 'musician',
        createdAt: new Date(),
        profilePicture: '',
        bio: 'This is a mock user profile'
      });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio } = req.body;
    
    if (process.env.ENABLE_DB === 'true') {
      // Find and update user
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (name) user.name = name;
      if (bio) user.bio = bio;
      
      await user.save();
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          bio: user.bio,
          profilePicture: user.profilePicture
        }
      });
    } else {
      // Mock response when database is not enabled
      res.json({
        message: 'Profile updated successfully (mock)',
        user: {
          id: req.user.id,
          email: req.user.email,
          name: name || 'Mock User',
          userType: req.user.userType || 'musician',
          bio: bio || 'This is a mock user profile',
          profilePicture: ''
        }
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
