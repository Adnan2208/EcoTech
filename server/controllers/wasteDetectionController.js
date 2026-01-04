const path = require('path');
const Report = require('../models/Report');
const { detectWaste, analyzeMultipleImages, mapToCategory } = require('../services/wasteDetection');

// @desc    Analyze a single image for waste detection
// @route   POST /api/waste-detection/analyze
// @access  Private
exports.analyzeImage = async (req, res) => {
    try {
        // Check if image was uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image to analyze',
            });
        }

        // Get the first uploaded image
        const imageFile = req.files[0];
        const base64Image = imageFile.buffer.toString('base64');

        // Run detection
        const results = await detectWaste(base64Image, true);

        // Get suggested category based on detections
        const suggestedCategory = results.summary?.dominantClass
            ? mapToCategory(results.summary.dominantClass)
            : 'other';

        res.status(200).json({
            success: true,
            data: {
                ...results,
                suggestedCategory,
            },
        });
    } catch (error) {
        console.error('Waste detection error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to analyze image',
        });
    }
};

// @desc    Analyze images for an existing report
// @route   POST /api/waste-detection/report/:reportId
// @access  Private (Authority)
exports.analyzeReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found',
            });
        }

        if (!report.images || report.images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Report has no images to analyze',
            });
        }

        // Get image paths from the uploads directory
        const imagePaths = report.images.map(img =>
            path.join(__dirname, '..', img.url)
        );

        // Analyze all images
        const results = await analyzeMultipleImages(imagePaths);

        // Update report with detection results
        const updatedReport = await Report.findByIdAndUpdate(
            req.params.reportId,
            {
                detectionResults: results.detections,
                detectionSummary: {
                    totalDetections: results.totalDetections,
                    analyzedAt: new Date(),
                    success: results.success,
                }
            },
            { new: true }
        ).populate('userId', 'name email');

        // Emit socket event for real-time updates
        if (req.io) {
            req.io.emit('detectionComplete', {
                reportId: req.params.reportId,
                detectionResults: results,
            });
        }

        res.status(200).json({
            success: true,
            data: {
                report: updatedReport,
                detectionResults: results,
            },
        });
    } catch (error) {
        console.error('Report analysis error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to analyze report images',
        });
    }
};

// @desc    Get detection results for a report
// @route   GET /api/waste-detection/report/:reportId
// @access  Private
exports.getDetectionResults = async (req, res) => {
    try {
        const report = await Report.findById(req.params.reportId)
            .select('images detectionResults detectionSummary');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                images: report.images,
                detectionResults: report.detectionResults || [],
                detectionSummary: report.detectionSummary || null,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get all reports with detection statistics
// @route   GET /api/waste-detection/stats
// @access  Private (Authority)
exports.getDetectionStats = async (req, res) => {
    try {
        // Get all reports with detections
        const reportsWithDetections = await Report.find({
            'detectionResults.0': { $exists: true }
        }).select('detectionResults detectionSummary createdAt');

        // Aggregate detection classes
        const classCounts = {};
        let totalDetections = 0;
        let totalConfidence = 0;

        reportsWithDetections.forEach(report => {
            report.detectionResults.forEach(detection => {
                const className = detection.class;
                classCounts[className] = (classCounts[className] || 0) + 1;
                totalDetections++;
                totalConfidence += detection.confidence || 0;
            });
        });

        // Sort classes by count
        const sortedClasses = Object.entries(classCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        res.status(200).json({
            success: true,
            data: {
                totalReportsAnalyzed: reportsWithDetections.length,
                totalDetections,
                avgConfidence: totalDetections > 0
                    ? Math.round((totalConfidence / totalDetections) * 100) / 100
                    : 0,
                wasteTypeDistribution: sortedClasses,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
