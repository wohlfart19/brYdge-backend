const express = require('express');
const router = express.Router();
const ClearanceRequest = require('../models/ClearanceRequest');
const Song = require('../models/Song');
const Sample = require('../models/Sample');
const { authenticateToken, isRightsHolder, isMusician } = require('../middleware/auth');

// Enhanced clearance workflow system

// GET clearance requests for the logged-in user
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    let query = {};
    
    if (userType === 'musician') {
      // Musicians see requests they've submitted
      query = { requestedBy: userId };
    } else if (userType === 'rightsHolder') {
      // Rights holders see requests for their songs
      query = { rightsHolder: userId };
    }
    
    if (process.env.ENABLE_DB === 'true') {
      const clearanceRequests = await ClearanceRequest.find(query)
        .sort({ requestDate: -1 })
        .populate('sample', 'title artist')
        .populate('originalSong', 'title artist')
        .populate('requestedBy', 'name email')
        .populate('rightsHolder', 'name email');
      
      res.json(clearanceRequests);
    } else {
      // Mock response when database is not enabled
      const mockRequests = [
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
            _id: userId,
            name: 'User Name',
            email: req.user.email
          },
          rightsHolder: {
            _id: 'mock-user-id-2',
            name: 'Rights Holder Name',
            email: 'rightsholder@example.com'
          },
          status: 'pending',
          requestDate: new Date(),
          usageDescription: 'I want to use this sample in my upcoming album'
        }
      ];
      
      res.json(mockRequests);
    }
  } catch (error) {
    console.error('Error fetching user clearance requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET potential matches for a sample
router.get('/potential-matches/:sampleId', authenticateToken, isMusician, async (req, res) => {
  try {
    const sampleId = req.params.sampleId;
    
    if (process.env.ENABLE_DB === 'true') {
      const sample = await Sample.findById(sampleId);
      if (!sample) {
        return res.status(404).json({ error: 'Sample not found' });
      }
      
      // In a real implementation, we would use the fingerprint to find matches
      // For now, we'll return mock potential matches
      const potentialMatches = await Song.find().limit(3);
      
      res.json({
        sample,
        potentialMatches
      });
    } else {
      // Mock response when database is not enabled
      res.json({
        sample: {
          _id: sampleId,
          title: 'Sample Title',
          artist: 'Sample Artist',
          fingerprint: 'mock-fingerprint'
        },
        potentialMatches: [
          {
            _id: 'mock-song-id-1',
            title: 'Original Song 1',
            artist: 'Artist 1',
            matchConfidence: 0.85
          },
          {
            _id: 'mock-song-id-2',
            title: 'Original Song 2',
            artist: 'Artist 2',
            matchConfidence: 0.72
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error finding potential matches:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create a clearance request with automatic matching
router.post('/create-with-matching', authenticateToken, isMusician, async (req, res) => {
  try {
    const { sampleId, usageDescription } = req.body;
    
    if (!sampleId || !usageDescription) {
      return res.status(400).json({ error: 'Sample ID and usage description are required' });
    }
    
    if (process.env.ENABLE_DB === 'true') {
      const sample = await Sample.findById(sampleId);
      if (!sample) {
        return res.status(404).json({ error: 'Sample not found' });
      }
      
      // In a real implementation, we would use the fingerprint to find the best match
      // For now, we'll use a mock match
      const mockMatchedSong = await Song.findOne();
      if (!mockMatchedSong) {
        return res.status(404).json({ error: 'No potential matches found' });
      }
      
      const clearanceRequest = new ClearanceRequest({
        sample: sampleId,
        originalSong: mockMatchedSong._id,
        requestedBy: req.user.id,
        rightsHolder: mockMatchedSong.uploadedBy,
        usageDescription,
        status: 'pending',
        requestDate: new Date(),
        matchConfidence: 0.85 // Mock confidence score
      });
      
      await clearanceRequest.save();
      
      res.status(201).json({
        message: 'Clearance request created with automatic matching',
        clearanceRequest
      });
    } else {
      // Mock response when database is not enabled
      res.status(201).json({
        message: 'Clearance request created with automatic matching (mock)',
        clearanceRequest: {
          _id: 'mock-request-id-' + Date.now(),
          sample: sampleId,
          originalSong: 'mock-song-id-1',
          requestedBy: req.user.id,
          rightsHolder: 'mock-rights-holder-id',
          usageDescription,
          status: 'pending',
          requestDate: new Date(),
          matchConfidence: 0.85
        }
      });
    }
  } catch (error) {
    console.error('Error creating clearance request with matching:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT respond to a clearance request with terms
router.put('/:id/respond', authenticateToken, isRightsHolder, async (req, res) => {
  try {
    const { status, termsOfUse, royaltyPercentage, notes } = req.body;
    
    if (!status || !['approved', 'rejected', 'negotiating'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved, rejected, or negotiating) is required' });
    }
    
    if (status === 'approved' && !termsOfUse) {
      return res.status(400).json({ error: 'Terms of use are required for approval' });
    }
    
    if (process.env.ENABLE_DB === 'true') {
      const clearanceRequest = await ClearanceRequest.findById(req.params.id);
      if (!clearanceRequest) {
        return res.status(404).json({ error: 'Clearance request not found' });
      }
      
      // Verify that the logged-in rights holder owns the original song
      if (clearanceRequest.rightsHolder.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to respond to this request' });
      }
      
      clearanceRequest.status = status;
      clearanceRequest.responseDate = new Date();
      
      if (termsOfUse) clearanceRequest.termsOfUse = termsOfUse;
      if (royaltyPercentage) clearanceRequest.royaltyPercentage = royaltyPercentage;
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
          royaltyPercentage: royaltyPercentage || 0,
          notes: notes || '',
          responseDate: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error responding to clearance request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT accept or counter terms
router.put('/:id/accept-terms', authenticateToken, isMusician, async (req, res) => {
  try {
    const { action, counterProposal } = req.body;
    
    if (!action || !['accept', 'counter'].includes(action)) {
      return res.status(400).json({ error: 'Valid action (accept or counter) is required' });
    }
    
    if (action === 'counter' && !counterProposal) {
      return res.status(400).json({ error: 'Counter proposal is required when action is counter' });
    }
    
    if (process.env.ENABLE_DB === 'true') {
      const clearanceRequest = await ClearanceRequest.findById(req.params.id);
      if (!clearanceRequest) {
        return res.status(404).json({ error: 'Clearance request not found' });
      }
      
      // Verify that the logged-in musician is the requester
      if (clearanceRequest.requestedBy.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to respond to this request' });
      }
      
      if (action === 'accept') {
        clearanceRequest.status = 'finalized';
        clearanceRequest.finalizedDate = new Date();
      } else {
        clearanceRequest.status = 'negotiating';
        clearanceRequest.counterProposal = counterProposal;
        clearanceRequest.counterDate = new Date();
      }
      
      await clearanceRequest.save();
      
      res.json({
        message: action === 'accept' ? 'Terms accepted, clearance finalized' : 'Counter proposal submitted',
        clearanceRequest
      });
    } else {
      // Mock response when database is not enabled
      res.json({
        message: action === 'accept' ? 'Terms accepted, clearance finalized (mock)' : 'Counter proposal submitted (mock)',
        clearanceRequest: {
          _id: req.params.id,
          status: action === 'accept' ? 'finalized' : 'negotiating',
          counterProposal: action === 'counter' ? counterProposal : null,
          finalizedDate: action === 'accept' ? new Date() : null,
          counterDate: action === 'counter' ? new Date() : null
        }
      });
    }
  } catch (error) {
    console.error('Error processing terms response:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET clearance statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    if (process.env.ENABLE_DB === 'true') {
      const userId = req.user.id;
      const userType = req.user.userType;
      
      let query = {};
      
      if (userType === 'musician') {
        query = { requestedBy: userId };
      } else if (userType === 'rightsHolder') {
        query = { rightsHolder: userId };
      }
      
      const totalRequests = await ClearanceRequest.countDocuments(query);
      const pendingRequests = await ClearanceRequest.countDocuments({ ...query, status: 'pending' });
      const approvedRequests = await ClearanceRequest.countDocuments({ ...query, status: 'approved' });
      const rejectedRequests = await ClearanceRequest.countDocuments({ ...query, status: 'rejected' });
      const negotiatingRequests = await ClearanceRequest.countDocuments({ ...query, status: 'negotiating' });
      const finalizedRequests = await ClearanceRequest.countDocuments({ ...query, status: 'finalized' });
      
      res.json({
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        negotiatingRequests,
        finalizedRequests
      });
    } else {
      // Mock response when database is not enabled
      res.json({
        totalRequests: 10,
        pendingRequests: 3,
        approvedRequests: 4,
        rejectedRequests: 1,
        negotiatingRequests: 1,
        finalizedRequests: 1
      });
    }
  } catch (error) {
    console.error('Error fetching clearance statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
