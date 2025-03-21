const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Sample = require('../models/Sample');
const { authenticateToken, isMusician } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/samples');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only audio files
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET all samples
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const samples = await Sample.find().sort({ uploadDate: -1 });
      res.json(samples);
    } else {
      // Mock response when database is not enabled
      res.json([
        {
          _id: 'mock-sample-id-1',
          title: 'Sample Beat 1',
          artist: 'Producer 1',
          uploadDate: new Date()
        },
        {
          _id: 'mock-sample-id-2',
          title: 'Sample Beat 2',
          artist: 'Producer 2',
          uploadDate: new Date(Date.now() - 86400000) // 1 day ago
        }
      ]);
    }
  } catch (error) {
    console.error('Error fetching samples:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a single sample by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const sample = await Sample.findById(req.params.id);
      if (!sample) {
        return res.status(404).json({ error: 'Sample not found' });
      }
      res.json(sample);
    } else {
      // Mock response when database is not enabled
      res.json({
        _id: req.params.id,
        title: 'Sample Beat',
        artist: 'Sample Producer',
        filename: 'sample-beat.mp3',
        filepath: '/uploads/samples/sample-beat.mp3',
        filesize: 1024000,
        mimetype: 'audio/mpeg',
        uploadDate: new Date()
      });
    }
  } catch (error) {
    console.error('Error fetching sample:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new sample
router.post('/', authenticateToken, isMusician, upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const { title, artist } = req.body;
    
    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    const sampleData = {
      title,
      artist,
      filename: req.file.filename,
      filepath: req.file.path,
      filesize: req.file.size,
      mimetype: req.file.mimetype
    };

    if (process.env.ENABLE_DB === 'true') {
      const sample = new Sample(sampleData);
      await sample.save();
      res.status(201).json({
        message: 'Sample uploaded successfully',
        sample
      });
    } else {
      // Mock response when database is not enabled
      res.status(201).json({
        message: 'Sample uploaded successfully (mock)',
        sample: {
          _id: 'mock-sample-id-' + Date.now(),
          ...sampleData,
          uploadDate: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error uploading sample:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// DELETE a sample
router.delete('/:id', authenticateToken, isMusician, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const sample = await Sample.findById(req.params.id);
      if (!sample) {
        return res.status(404).json({ error: 'Sample not found' });
      }
      
      // Delete the file from the filesystem
      if (fs.existsSync(sample.filepath)) {
        fs.unlinkSync(sample.filepath);
      }
      
      await Sample.findByIdAndDelete(req.params.id);
      res.json({ message: 'Sample deleted successfully' });
    } else {
      // Mock response when database is not enabled
      res.json({ message: `Sample with ID ${req.params.id} deleted successfully (mock)` });
    }
  } catch (error) {
    console.error('Error deleting sample:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
