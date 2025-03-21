const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Song = require('../models/Song');
const { authenticateToken, isRightsHolder } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/songs');
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

// GET all songs
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const songs = await Song.find().sort({ uploadDate: -1 });
      res.json(songs);
    } else {
      // Mock response when database is not enabled
      res.json([
        {
          _id: 'mock-song-id-1',
          title: 'Sample Song 1',
          artist: 'Artist 1',
          uploadDate: new Date()
        },
        {
          _id: 'mock-song-id-2',
          title: 'Sample Song 2',
          artist: 'Artist 2',
          uploadDate: new Date(Date.now() - 86400000) // 1 day ago
        }
      ]);
    }
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a single song by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const song = await Song.findById(req.params.id);
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }
      res.json(song);
    } else {
      // Mock response when database is not enabled
      res.json({
        _id: req.params.id,
        title: 'Sample Song',
        artist: 'Sample Artist',
        filename: 'sample-song.mp3',
        filepath: '/uploads/songs/sample-song.mp3',
        filesize: 1024000,
        mimetype: 'audio/mpeg',
        uploadDate: new Date()
      });
    }
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new song
router.post('/', authenticateToken, isRightsHolder, upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const { title, artist } = req.body;
    
    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    const songData = {
      title,
      artist,
      filename: req.file.filename,
      filepath: req.file.path,
      filesize: req.file.size,
      mimetype: req.file.mimetype
    };

    if (process.env.ENABLE_DB === 'true') {
      const song = new Song(songData);
      await song.save();
      res.status(201).json({
        message: 'Song uploaded successfully',
        song
      });
    } else {
      // Mock response when database is not enabled
      res.status(201).json({
        message: 'Song uploaded successfully (mock)',
        song: {
          _id: 'mock-song-id-' + Date.now(),
          ...songData,
          uploadDate: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error uploading song:', error);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// DELETE a song
router.delete('/:id', authenticateToken, isRightsHolder, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const song = await Song.findById(req.params.id);
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }
      
      // Delete the file from the filesystem
      if (fs.existsSync(song.filepath)) {
        fs.unlinkSync(song.filepath);
      }
      
      await Song.findByIdAndDelete(req.params.id);
      res.json({ message: 'Song deleted successfully' });
    } else {
      // Mock response when database is not enabled
      res.json({ message: `Song with ID ${req.params.id} deleted successfully (mock)` });
    }
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
