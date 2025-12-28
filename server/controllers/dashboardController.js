const Report = require('../models/Report');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private (Authority)
exports.getStats = async (req, res) => {
  try {
    // Get total counts by status
    const statusCounts = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get counts by category
    const categoryCounts = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get counts by severity
    const severityCounts = await Report.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get reports trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyTrend = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get resolution rate
    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const resolutionRate = totalReports > 0 
      ? ((resolvedReports / totalReports) * 100).toFixed(2) 
      : 0;

    // Get average resolution time (for resolved reports)
    const avgResolutionTime = await Report.aggregate([
      {
        $match: {
          status: 'resolved',
          resolvedAt: { $ne: null },
        },
      },
      {
        $project: {
          resolutionTime: {
            $subtract: ['$resolvedAt', '$createdAt'],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' },
        },
      },
    ]);

    // Convert milliseconds to hours
    const avgResolutionHours = avgResolutionTime.length > 0
      ? (avgResolutionTime[0].avgTime / (1000 * 60 * 60)).toFixed(2)
      : 0;

    // Get recent reports
    const recentReports = await Report.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Format status counts
    const statusStats = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
    };
    statusCounts.forEach((item) => {
      statusStats[item._id] = item.count;
    });

    // Format category counts
    const categoryStats = {};
    categoryCounts.forEach((item) => {
      categoryStats[item._id] = item.count;
    });

    // Format severity counts
    const severityStats = {
      low: 0,
      medium: 0,
      high: 0,
    };
    severityCounts.forEach((item) => {
      severityStats[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        statusStats,
        categoryStats,
        severityStats,
        resolutionRate: parseFloat(resolutionRate),
        avgResolutionHours: parseFloat(avgResolutionHours),
        dailyTrend,
        recentReports,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get reports by location (for map view)
// @route   GET /api/dashboard/map
// @access  Public
exports.getMapData = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .select('title category status severity location address createdAt')
      .limit(500);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
