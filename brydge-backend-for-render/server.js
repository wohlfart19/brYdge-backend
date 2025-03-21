const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Import routes
const songsRoutes = require('./routes/songs');
const samplesRoutes = require('./routes/samples');
const usersRoutes = require('./routes/users');
const clearanceRequestsRoutes = require('./routes/clearance-requests');
const fingerprintsRoutes = require('./routes/fingerprints');
const clearanceWorkflowRoutes = require('./routes/clearance-workflow');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to brYdge API - Music Sample Clearance Platform' });
});

// API Routes
app.use('/api/songs', songsRoutes);
app.use('/api/samples', samplesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clearance-requests', clearanceRequestsRoutes);
app.use('/api/fingerprints', fingerprintsRoutes);
app.use('/api/clearance-workflow', clearanceWorkflowRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the 10MB limit' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Database connection
const connectDB = require('./config/db');
// Connect to MongoDB when in production or when explicitly testing the database
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DB === 'true') {
  connectDB();
} else {
  console.log('MongoDB connection skipped in development mode. Set ENABLE_DB=true to connect.');
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
