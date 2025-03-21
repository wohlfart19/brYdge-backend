const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateFingerprint, compareSongs } = require('../utils/acoustidService');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/fingerprints');
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

// Generate fingerprint for an audio file
router.post('/fingerprint', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const result = await generateFingerprint(req.file.path);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({
      message: 'Fingerprint generated successfully',
      fingerprint: result.fingerprint,
      duration: result.duration,
      results: result.results
    });
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    res.status(500).json({ error: 'Server error during fingerprint generation' });
  }
});

// Compare two audio files to check if one is a sample of the other
router.post('/compare', upload.fields([
  { name: 'originalFile', maxCount: 1 },
  { name: 'sampleFile', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.originalFile || !req.files.sampleFile) {
      return res.status(400).json({ error: 'Both original and sample audio files are required' });
    }

    const originalFilePath = req.files.originalFile[0].path;
    const sampleFilePath = req.files.sampleFile[0].path;
    
    const result = await compareSongs(originalFilePath, sampleFilePath);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({
      message: 'Comparison completed',
      isMatch: result.isMatch,
      matchConfidence: result.matchConfidence,
      matchingIds: result.matchingIds
    });
  } catch (error) {
    console.error('Error comparing audio files:', error);
    res.status(500).json({ error: 'Server error during audio comparison' });
  }
});

// Match a sample against the database of original songs
router.post('/match', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    // In a real implementation, we would:
    // 1. Generate fingerprint for the uploaded file
    // 2. Query the database for all original songs
    // 3. Compare the fingerprint with each original song
    // 4. Return the best matches
    
    // For now, we'll just generate the fingerprint and return mock results
    const result = await generateFingerprint(req.file.path);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    // Mock matching results
    const mockMatches = [
      {
        songId: 'mock-song-id-1',
        title: 'Original Song 1',
        artist: 'Artist 1',
        confidence: 0.85
      },
      {
        songId: 'mock-song-id-2',
        title: 'Original Song 2',
        artist: 'Artist 2',
        confidence: 0.72
      }
    ];
    
    res.json({
      message: 'Matching completed',
      fingerprint: result.fingerprint,
      duration: result.duration,
      matches: mockMatches
    });
  } catch (error) {
    console.error('Error matching audio file:', error);
    res.status(500).json({ error: 'Server error during audio matching' });
  }
});

module.exports = router;
