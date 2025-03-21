const express = require('express');
const router = express.Router();
const ClearanceRequest = require('../models/ClearanceRequest');
const { authenticateToken, isMusician } = require('../middleware/auth');

// GET all clearance requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const clearanceRequests = await ClearanceRequest.find()
        .sort({ requestDate: -1 })
        .populate('sample', 'title artist')
        .populate('originalSong', 'title artist')
        .populate('requestedBy', 'name email')
        .populate('rightsHolder', 'name email');
      
      res.json(clearanceRequests);
    } else {
      // Mock response when database is not enabled
      res.json([
        {
          _id: 'mock-request-id-1',
          sample: {
            _id: 'mock-sample-id-1',
            title: 'Sample Beat 1',
            artist: 'Producer 1'
          },
          originalSong: {
            _id: 'mock-song-id-1',
            title: 'Original Song 1',
            artist: 'Artist 1'
          },
          requestedBy: {
            _id: 'mock-user-id-1',
            name: 'Producer Name',
            email: 'producer@example.com'
          },
          rightsHolder: {
            _id: 'mock-user-id-2',
            name: 'Rights Holder Name',
            email: 'rightsholder@example.com'
          },
          status: 'pending',
          requestDate: new Date(),
          usageDescription: 'I want to use this sample in my upcoming album'
        },
        {
          _id: 'mock-request-id-2',
          sample: {
            _id: 'mock-sample-id-2',
            title: 'Sample Beat 2',
            artist: 'Producer 2'
          },
          originalSong: {
            _id: 'mock-song-id-2',
            title: 'Original Song 2',
            artist: 'Artist 2'
          },
          requestedBy: {
            _id: 'mock-user-id-3',
            name: 'Another Producer',
            email: 'producer2@example.com'
          },
          rightsHolder: {
            _id: 'mock-user-id-4',
            name: 'Another Rights Holder',
            email: 'rightsholder2@example.com'
          },
          status: 'approved',
          requestDate: new Date(Date.now() - 86400000), // 1 day ago
          responseDate: new Date(),
          usageDescription: 'I want to use this sample in my upcoming EP',
          termsOfUse: 'Credit must be given in liner notes'
        }
      ]);
    }
  } catch (error) {
    console.error('Error fetching clearance requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a single clearance request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const clearanceRequest = await ClearanceRequest.findById(req.params.id)
        .populate('sample', 'title artist')
        .populate('originalSong', 'title artist')
        .populate('requestedBy', 'name email')
        .populate('rightsHolder', 'name email');
      
      if (!clearanceRequest) {
        return res.status(404).json({ error: 'Clearance request not found' });
      }
      
      res.json(clearanceRequest);
    } else {
      // Mock response when database is not enabled
      res.json({
        _id: req.params.id,
        sample: {
          _id: 'mock-sample-id-1',
          title: 'Sample Beat',
          artist: 'Producer'
        },
        originalSong: {
          _id: 'mock-song-id-1',
          title: 'Original Song',
          artist: 'Artist'
        },
        requestedBy: {
          _id: 'mock-user-id-1',
          name: 'Producer Name',
          email: 'producer@example.com'
        },
        rightsHolder: {
          _id: 'mock-user-id-2',
          name: 'Rights Holder Name',
          email: 'rightsholder@example.com'
        },
        status: 'pending',
        requestDate: new Date(),
        usageDescription: 'I want to use this sample in my upcoming album'
      });
    }
  } catch (error) {
    console.error('Error fetching clearance request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a new clearance request
router.post('/', authenticateToken, isMusician, async (req, res) => {
  try {
    const { sampleId, originalSongId, requestedById, rightsHolderId, usageDescription } = req.body;
    
    if (!sampleId || !originalSongId || !usageDescription) {
      return res.status(400).json({ error: 'Sample ID, original song ID, and usage description are required' });
    }

    const clearanceRequestData = {
      sample: sampleId,
      originalSong: originalSongId,
      requestedBy: requestedById || 'mock-user-id-1',
      rightsHolder: rightsHolderId || 'mock-user-id-2',
      usageDescription,
      status: 'pending',
      requestDate: new Date()
    };

    if (process.env.ENABLE_DB === 'true') {
      const clearanceRequest = new ClearanceRequest(clearanceRequestData);
      await clearanceRequest.save();
      
      res.status(201).json({
        message: 'Clearance request submitted successfully',
        clearanceRequest
      });
    } else {
      // Mock response when database is not enabled
      res.status(201).json({
        message: 'Clearance request submitted successfully (mock)',
        clearanceRequest: {
          _id: 'mock-request-id-' + Date.now(),
          ...clearanceRequestData
        }
      });
    }
  } catch (error) {
    console.error('Error submitting clearance request:', error);
    res.status(500).json({ error: 'Server error during submission' });
  }
});

// PUT update a clearance request (approve/reject)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, termsOfUse, notes } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved or rejected) is required' });
    }

    if (process.env.ENABLE_DB === 'true') {
      const clearanceRequest = await ClearanceRequest.findById(req.params.id);
      if (!clearanceRequest) {
        return res.status(404).json({ error: 'Clearance request not found' });
      }
      
      clearanceRequest.status = status;
      clearanceRequest.responseDate = new Date();
      
      if (termsOfUse) clearanceRequest.termsOfUse = termsOfUse;
      if (notes) clearanceRequest.notes = notes;
      
      await clearanceRequest.save();
      
      res.json({
        message: `Clearance request ${status}`,
        clearanceRequest
      });
    } else {
      // Mock response when database is not enabled
      res.json({
        message: `Clearance request ${status} (mock)`,
        clearanceRequest: {
          _id: req.params.id,
          status,
          termsOfUse: termsOfUse || '',
          notes: notes || '',
          responseDate: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error updating clearance request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
