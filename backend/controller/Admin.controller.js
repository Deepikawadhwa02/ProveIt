// controllers/Admin.controller.js
const User = require('../models/User');
const Exam = require('../models/Exam');
const Attempt = require('../models/Attempt');
const mongoose = require('mongoose');

// @route   GET /api/admin/stats
// @desc    Get summary statistics for admin dashboard
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    // Verify user is admin
    console.log(req.user);
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    // Get total users count
    const totalUsers = await User.countDocuments();
    console.log(totalUsers);
    
    
    // Get total active exams count
    const totalExams = await Exam.countDocuments({ isActive: true });
    
    // Get total exam attempts
    const totalAttempts = await Attempt.countDocuments();
    
    // Get total certificates (passed attempts)
    const totalCertificates = await Attempt.countDocuments({ isPassed: true });
    
    // Get recent issues (attempts with time-out status in last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentIssues = await Attempt.countDocuments({
      status: 'timed-out',
      endTime: { $gte: lastWeek }
    });
    
    res.json({
      totalUsers,
      totalExams,
      totalAttempts,
      totalCertificates,
      recentIssues
    });
    
  } catch (err) {
    console.error('Error getting admin stats:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/admin/exam-activity
// @desc    Get exam activity data for given time range
// @access  Private (Admin)
exports.getExamActivity = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { timeRange } = req.query; // week, month, year
    let dateFormat, startDate;
    
    const now = new Date();
    
    // Set date range based on timeRange
    if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      dateFormat = '%Y-%m-%d'; // Daily format
    } else if (timeRange === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      dateFormat = '%Y-%m'; // Monthly format
    } else {
      // Default to month
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      dateFormat = '%Y-%m-%d'; // Daily format
    }
    
    // Aggregate exam attempts by date
    const activityData = await Attempt.aggregate([
      {
        $match: {
          startTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: dateFormat, date: '$startTime' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: { 
            $push: { 
              status: '$_id.status', 
              count: '$count' 
            } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          attempts: {
            $sum: '$statuses.count'
          },
          completed: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$statuses',
                    as: 'status',
                    cond: { $eq: ['$$status.status', 'completed'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    res.json(activityData);
    
  } catch (err) {
    console.error('Error getting exam activity:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/admin/user-roles
// @desc    Get user role distribution
// @access  Private (Admin)
exports.getUserRoleDistribution = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const roleData = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$count'
        }
      }
    ]);
    
    res.json(roleData);
    
  } catch (err) {
    console.error('Error getting user role distribution:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/admin/pass-rates
// @desc    Get pass rates by exam category
// @access  Private (Admin)
exports.getPassRates = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { timeRange } = req.query; // week, month, year
    let startDate;
    
    const now = new Date();
    
    // Set date range based on timeRange
    if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      // Default to month
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }
    
    // First get all completed exams in the time period with their categories
    const completedExams = await Attempt.aggregate([
      {
        $match: {
          status: 'completed',
          endTime: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'exam',
          foreignField: '_id',
          as: 'examData'
        }
      },
      {
        $unwind: '$examData'
      },
      {
        $group: {
          _id: '$examData.category', // Assuming exams have a category field
          total: { $sum: 1 },
          passed: {
            $sum: { $cond: ['$isPassed', 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ['$_id', 'Uncategorized'] },
          passRate: {
            $multiply: [
              { $divide: ['$passed', '$total'] },
              100
            ]
          }
        }
      },
      {
        $sort: { passRate: -1 }
      }
    ]);
    
    res.json(completedExams);
    
  } catch (err) {
    console.error('Error getting pass rates:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/admin/user-growth
// @desc    Get user growth over time
// @access  Private (Admin)
exports.getUserGrowth = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const { timeRange } = req.query; // week, month, year
    let dateFormat, startDate;
    
    const now = new Date();
    
    // Set date range based on timeRange
    if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      dateFormat = '%Y-%m-%d'; // Daily format
    } else if (timeRange === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      dateFormat = '%Y-%m'; // Monthly format
    } else {
      // Default to month
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      dateFormat = '%Y-%m-%d'; // Daily format
    }
    
    // Aggregate user registrations by date and role
    const growthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          roles: { 
            $push: { 
              role: '$_id.role', 
              count: '$count' 
            } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          students: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$roles',
                    as: 'role',
                    cond: { $eq: ['$$role.role', 'student'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          },
          examiners: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$roles',
                    as: 'role',
                    cond: { $eq: ['$$role.role', 'examiner'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          },
          admins: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$roles',
                    as: 'role',
                    cond: { $eq: ['$$role.role', 'admin'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    res.json(growthData);
    
  } catch (err) {
    console.error('Error getting user growth:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/admin/top-exams
// @desc    Get top exams by participation
// @access  Private (Admin)
exports.getTopExams = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    // Get top 5 exams by attempt count
    const topExams = await Attempt.aggregate([
      {
        $group: {
          _id: '$exam',
          attempts: { $sum: 1 }
        }
      },
      {
        $sort: { attempts: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'examData'
        }
      },
      {
        $unwind: '$examData'
      },
      {
        $project: {
          _id: 0,
          title: '$examData.title',
          attempts: 1
        }
      }
    ]);
    
    res.json(topExams);
    
  } catch (err) {
    console.error('Error getting top exams:', err.message);
    res.status(500).send('Server error');
  }
};