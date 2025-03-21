const fs = require('fs');
const path = require('path');
const acoustid = require('node-acoustid');

// Configuration
const ACOUSTID_API_KEY = 'YOUR_ACOUSTID_API_KEY'; // You'll need to register for an API key at acoustid.org

/**
 * Generate audio fingerprint and lookup metadata using AcoustID
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Promise<Object>} - Fingerprint and metadata results
 */
const generateFingerprint = async (audioFilePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`File not found: ${audioFilePath}`);
    }

    // Generate fingerprint and lookup metadata
    const results = await acoustid(ACOUSTID_API_KEY, audioFilePath);
    
    return {
      success: true,
      fingerprint: results.fingerprint,
      duration: results.duration,
      results: results.results
    };
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Compare two audio files to determine if one is a sample of the other
 * @param {string} originalFilePath - Path to the original audio file
 * @param {string} sampleFilePath - Path to the potential sample audio file
 * @returns {Promise<Object>} - Comparison results
 */
const compareSongs = async (originalFilePath, sampleFilePath) => {
  try {
    // Generate fingerprints for both files
    const originalResult = await generateFingerprint(originalFilePath);
    const sampleResult = await generateFingerprint(sampleFilePath);
    
    if (!originalResult.success || !sampleResult.success) {
      throw new Error('Failed to generate fingerprints for comparison');
    }
    
    // Check if the sample's fingerprint matches the original's fingerprint
    // This is a simplified approach - in a real implementation, you would use
    // more sophisticated algorithms to detect partial matches
    
    // For now, we'll check if any of the results from the sample match the original
    const originalIds = originalResult.results.map(result => result.recordings.map(rec => rec.id)).flat();
    const sampleIds = sampleResult.results.map(result => result.recordings.map(rec => rec.id)).flat();
    
    const matchingIds = originalIds.filter(id => sampleIds.includes(id));
    
    return {
      success: true,
      isMatch: matchingIds.length > 0,
      matchConfidence: matchingIds.length > 0 ? (matchingIds.length / Math.min(originalIds.length, sampleIds.length)) : 0,
      matchingIds,
      originalFingerprint: originalResult.fingerprint,
      sampleFingerprint: sampleResult.fingerprint
    };
  } catch (error) {
    console.error('Error comparing songs:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateFingerprint,
  compareSongs
};
