const express = require('express');
const router = express.Router();
const { getStats, getMapData } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/map', getMapData);

// Authority only routes
router.get('/stats', protect, authorize('authority'), getStats);

module.exports = router;
