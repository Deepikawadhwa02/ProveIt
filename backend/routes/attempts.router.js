const express = require('express');
const router = express.Router();
const {
    startExam,
    submitAnswers,
    getUserAttempts,
    getAttempt,
    getAttemptsByExam,
    logViolation,
    forceSubmitAttempt,
    saveAnswersProgress
} = require('../controller/Attempt.controller');
const auth = require('../middleware/auth.middleware');
const { downloadCertificate } = require('../controller/Certificate.controller');

const maxWarnings = 3; // Maximum number of warnings before auto-submit

// @route   POST /api/exams/:id/start
// @desc    Start a new exam attempt
// @access  Private (Student)
router.post('/exams/:id/start', auth, startExam);

// @route   POST /api/attempts/:id/submit
// @desc    Submit answers for an attempt
// @access  Private (Student)
router.post('/:id/submit', auth, submitAnswers);

// @route   POST /api/attempts/:id/force-submit
// @desc    Force submit an attempt
// @access  Private (Student)
router.post('/:id/force-submit', auth, forceSubmitAttempt);

// @route   GET /api/users/attempts
// @desc    Get all attempts for a user
// @access  Private
router.get('/users/attempts', auth, getUserAttempts);

// @route   GET /api/attempts/:id
// @desc    Get attempt by ID
// @access  Private
router.get('/:id', auth, getAttempt);

// @route   GET /api/attempts/attempts/:examId
// @desc    Get all attempts for a specific exam by the current user
// @access  Private
router.get('/attempts/:examId', auth, getAttemptsByExam);

router.post('/:id/save', auth, saveAnswersProgress);

router.get('/:attemptId/certificate', auth, downloadCertificate);

router.post('/:id/violation', auth, logViolation);

module.exports = router;