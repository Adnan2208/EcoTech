const express = require('express');
const router = express.Router();
const {
    analyzeImage,
    analyzeReport,
    getDetectionResults,
    getDetectionStats,
} = require('../controllers/wasteDetectionController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Analyze uploaded image (any authenticated user)
router.post('/analyze', protect, upload.array('images', 1), analyzeImage);

// Analyze a report's images (authority only)
router.post('/report/:reportId', protect, authorize('authority'), analyzeReport);

// Get detection results for a report
router.get('/report/:reportId', protect, getDetectionResults);

// Get overall detection statistics (authority only)
router.get('/stats', protect, authorize('authority'), getDetectionStats);

module.exports = router;
