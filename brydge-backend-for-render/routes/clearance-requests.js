const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ClearanceRequest = require('../models/ClearanceRequest');
const User = require('../models/User');
const Song = require('../models/Song');

// Get clearance requests for a musician
router.get('/musician/:userId', auth, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({
      'requestedBy.id': req.params.userId
    }).sort({ requestDate: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching musician requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get clearance requests for a rights holder
router.get('/rights-holder/:userId', auth, async (req, res) => {
  try {
    const requests = await ClearanceRequest.find({
      'rightsHolder.id': req.params.userId
    }).sort({ requestDate: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching rights holder requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new clearance request
router.post('/', auth, async (req, res) => {
  try {
    const {
      sampleTitle,
      sampleArtist,
      sampleFileUrl,
      originalSongId,
      usageDescription
    } = req.body;
    
    // Get the original song
    const originalSong = await Song.findById(originalSongId);
    if (!originalSong) {
      return res.status(404).json({ message: 'Original song not found' });
    }
    
    // Get the requesting user
    const requestingUser = await User.findById(req.userId);
    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify user is a musician
    if (requestingUser.userType !== 'musician') {
      return res.status(403).json({ message: 'Only musicians can request clearance' });
    }
    
    // Create the clearance request
    const clearanceRequest = new ClearanceRequest({
      sample: {
        title: sampleTitle,
        artist: sampleArtist,
        fileUrl: sampleFileUrl
      },
      originalSong: {
        title: originalSong.title,
        artist: originalSong.artist,
        id: originalSong._id
      },
      requestedBy: {
        id: requestingUser._id,
        name: requestingUser.name
      },
      rightsHolder: {
        id: originalSong.uploadedBy,
        name: originalSong.artistName
      },
      usageDescription
    });
    
    await clearanceRequest.save();
    res.status(201).json(clearanceRequest);
  } catch (error) {
    console.error('Error creating clearance request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to a clearance request
router.put('/:requestId/respond', auth, async (req, res) => {
  try {
    const { status, termsOfUse, royaltyPercentage, notes } = req.body;
    
    // Find the request
    const request = await ClearanceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Clearance request not found' });
    }
    
    // Verify user is the rights holder
    if (request.rightsHolder.id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }
    
    // Update the request
    request.status = status;
    request.responseDate = Date.now();
    
    if (status === 'approved' || status === 'negotiating') {
      request.termsOfUse = termsOfUse;
      request.royaltyPercentage = royaltyPercentage;
    }
    
    if (status === 'rejected') {
      request.notes = notes;
    }
    
    if (status === 'finalized') {
      request.finalizedDate = Date.now();
    }
    
    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Error responding to clearance request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit a counter proposal
router.put('/:requestId/counter', auth, async (req, res) => {
  try {
    const { counterProposal } = req.body;
    
    // Find the request
    const request = await ClearanceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Clearance request not found' });
    }
    
    // Verify user is the musician
    if (request.requestedBy.id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to counter this request' });
    }
    
    // Update the request
    request.status = 'negotiating';
    request.counterProposal = counterProposal;
    request.counterDate = Date.now();
    
    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Error submitting counter proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
