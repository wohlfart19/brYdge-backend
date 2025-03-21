const mongoose = require('mongoose');

const clearanceRequestSchema = new mongoose.Schema({
  sample: {
    title: {
      type: String,
      required: true
    },
    artist: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    }
  },
  originalSong: {
    title: {
      type: String,
      required: true
    },
    artist: {
      type: String,
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
      required: true
    }
  },
  requestedBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  rightsHolder: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    }
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
    type: Number
  },
  notes: {
    type: String
  },
  counterProposal: {
    type: String
  },
  counterDate: {
    type: Date
  }
});

module.exports = mongoose.model('ClearanceRequest', clearanceRequestSchema);
