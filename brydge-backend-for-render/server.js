const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Connect to MongoDB
if (process.env.ENABLE_DB === 'true') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Define routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to brYdge API - Music Sample Clearance Platform' });
});

// Song routes
app.use('/api/songs', require('./routes/songs'));

// Sample routes
app.use('/api/samples', require('./routes/samples'));

// Fingerprint routes
app.use('/api/fingerprints', require('./routes/fingerprints'));

// User routes - new
app.use('/api/users', require('./routes/users'));

// Clearance request routes - new
app.use('/api/clearance-requests', require('./routes/clearanceRequests'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
