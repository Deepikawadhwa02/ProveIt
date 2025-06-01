// routes/admin.router.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getExamActivity,
  getUserRoleDistribution,
  getPassRates,
  getUserGrowth,
  getTopExams
} = require('../controller/Admin.controller');
const auth = require('../middleware/auth.middleware');

// @route   GET /api/admin/stats
// @desc    Get summary statistics for admin dashboard
// @access  Private (Admin)
router.get('/stats', auth, getDashboardStats);

// @route   GET /api/admin/exam-activity
// @desc    Get exam activity data for given time range
// @access  Private (Admin)
router.get('/exam-activity', auth, getExamActivity);

// @route   GET /api/admin/user-roles
// @desc    Get user role distribution
// @access  Private (Admin)
router.get('/user-roles', auth, getUserRoleDistribution);

// @route   GET /api/admin/pass-rates
// @desc    Get pass rates by exam category
// @access  Private (Admin)
router.get('/pass-rates', auth, getPassRates);

// @route   GET /api/admin/user-growth
// @desc    Get user growth over time
// @access  Private (Admin)
router.get('/user-growth', auth, getUserGrowth);

// @route   GET /api/admin/top-exams
// @desc    Get top exams by participation
// @access  Private (Admin)
router.get('/top-exams', auth, getTopExams);

module.exports = router;