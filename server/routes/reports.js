const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  getMyReports,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadImages } = require('../middleware/upload');

// Protected routes (static paths must come before dynamic :id routes)
router.get('/user/my-reports', protect, getMyReports);
router.post('/', protect, upload.array('images', 5), uploadImages, createReport);

// Public routes
router.get('/', getReports);
router.get('/:id', getReport);

// Protected routes with dynamic id
router.delete('/:id', protect, deleteReport);

// Authority only routes (with optional resolution images upload)
router.put('/:id', protect, authorize('authority'), upload.array('resolutionImages', 5), uploadImages, updateReport);

module.exports = router;
