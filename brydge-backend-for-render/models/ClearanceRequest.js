const mongoose = require('mongoose');

// Update the ClearanceRequest schema to support the enhanced workflow
const clearanceRequestSchema = new mongoose.Schema({
  sample: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sample',
    required: true
  },
  originalSong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rightsHolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'negotiating', 'finalized'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  responseDate: {
    type: Date
  },
  counterDate: {
    type: Date
  },
  finalizedDate: {
    type: Date
  },
  usageDescription: {
    type: String,
    required: true
  },
  termsOfUse: {
    type: String
  },
  royaltyPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: {
    type: String
  },
  counterProposal: {
    type: String
  },
  matchConfidence: {
    type: Number,
    min: 0,
    max: 1
  }
});

module.exports = mongoose.model('ClearanceRequest', clearanceRequestSchema);
