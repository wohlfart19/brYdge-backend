const mongoose = require('mongoose');

const sampleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  filesize: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Will be required once user authentication is implemented
  },
  fingerprint: {
    type: String,
    required: false // Will be populated when Acoustid integration is implemented
  },
  originalSongs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }]
});

const Sample = mongoose.model('Sample', sampleSchema);

module.exports = Sample;
