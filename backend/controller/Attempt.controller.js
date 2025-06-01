const Attempt = require("../models/Attempt");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
//const emailService = require('../services/email.service');
const Violation = require('../models/Violation');

// @route   POST /api/exams/:id/start
// @desc    Start a new exam attempt
// @access  Private (Student)
exports.startExam = async (req, res) => {
  try {
    // Verify user is a student
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "Only students can take exams" });
    }

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ msg: "Exam not found" });
    }

    if (!exam.isActive) {
      return res.status(400).json({ msg: "This exam is not currently active" });
    }

    // Check if user has an active attempt
    const activeAttempt = await Attempt.findOne({
      user: req.user.id,
      exam: exam._id,
      status: "in-progress",
    });

    if (activeAttempt) {
      return res.json(activeAttempt);
    }

    // Check if user can retake the exam
    if (!exam.allowRetake) {
      const completedAttempt = await Attempt.findOne({
        user: req.user.id,
        exam: exam._id,
        status: "completed",
      });

      if (completedAttempt) {
        return res
          .status(400)
          .json({ msg: "This exam does not allow retakes" });
      }
    } else {
      // Check retake time constraint
      const lastAttempt = await Attempt.findOne({
        user: req.user.id,
        exam: exam._id,
        status: "completed",
      }).sort({ endTime: -1 });

      if (lastAttempt) {
        const retakeDate = new Date(lastAttempt.endTime);
        retakeDate.setDate(retakeDate.getDate() + exam.retakeAfterDays);

        if (new Date() < retakeDate) {
          return res.status(400).json({
            msg: `You can retake this exam after ${retakeDate.toLocaleDateString()}`,
          });
        }
      }
    }

    // Create a new attempt
    const questions = await Question.find({ examId: exam._id });
    if (questions.length === 0) {
      return res.status(400).json({ msg: "No questions available for this exam" });
    }

    const newAttempt = new Attempt({
      user: req.user.id,
      exam: exam._id,
      startTime: new Date(),
    });

    const attempt = await newAttempt.save();

    res.json(attempt);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   POST /api/attempts/:id/submit
// @desc    Submit answers for an attempt
// @access  Private (Student)
exports.submitAnswers = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({ msg: 'Attempt not found' });
    }

    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { answers, isForced, warningCount } = req.body;

    // Update attempt
    attempt.answers = answers;
    attempt.status = 'completed';
    attempt.endTime = new Date();
    attempt.warningCount = warningCount;

    if (isForced) {
      attempt.submissionType = 'warning_limit';
    }

    // Calculate score
    const exam = await Exam.findById(attempt.exam);
    let totalScore = 0;
    let maxScore = 0;

    for (const ans of answers) {
      const question = await Question.findById(ans.question);
      if (question) {
        maxScore += question.score;
        if (
          ans.selectedOption !== undefined &&
          question.options[ans.selectedOption]?.isCorrect
        ) {
          totalScore += question.score;
        }
      }
    }

    attempt.score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    attempt.isPassed = attempt.score >= exam.passingScore;

    await attempt.save();

    res.json(attempt);
  } catch (err) {
    console.error('Error submitting answers:', err);
    res.status(500).json({ error: err.message });
  }
};

// @route   GET /api/users/attempts
// @desc    Get all attempts for a user
// @access  Private
exports.getUserAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.user.id })
      .populate("exam", "title description duration passingScore")
      .sort({ startTime: -1 });

    res.json(attempts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @route   GET /api/attempts/:id
// @desc    Get attempt by ID
// @access  Private
exports.getAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('exam')
      .populate('answers.question');

    if (!attempt) {
      return res.status(404).json({ msg: 'Attempt not found' });
    }

    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    res.json(attempt);
  } catch (err) {
    console.error('Error getting attempt:', err);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/attempts/attempts/:examId
// @desc    Get all attempts for a specific exam by the current user
// @access  Private
exports.getAttemptsByExam = async (req, res) => {
  try {
    const examId = req.params.examId;

    const attempts = await Attempt.find({
      user: req.user.id,
      exam: examId,
    }).sort({ startTime: -1 });

    res.json(attempts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// And implement this function in Attempt.controller.js
exports.saveAnswersProgress = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({ msg: 'Attempt not found' });
    }

    // Verify the attempt belongs to the user
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Update answers only, don't change status
    const { answers } = req.body;
    attempt.answers = answers;

    await attempt.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Add this new endpoint
exports.logViolation = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({ msg: 'Attempt not found' });
    }

    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ msg: 'Attempt is not in progress' });
    }

    const newWarningCount = req.body.warningCount;

    // Create violation record
    const violation = new Violation({
      attempt: attempt._id,
      user: req.user.id,
      type: req.body.type,
      warningCount: newWarningCount
    });

    await violation.save();

    // Update attempt
    attempt.warningCount = newWarningCount;
    await attempt.save();

    // Return response with flag indicating if force submit is needed
    res.json({
      warningCount: newWarningCount,
      shouldForceSubmit: newWarningCount >= 3
    });

  } catch (err) {
    console.error('Error logging violation:', err);
    res.status(500).send('Server error');
  }
};

exports.forceSubmitAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('exam');

    if (!attempt) {
      return res.status(404).json({ msg: 'Attempt not found' });
    }

    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (attempt.status !== 'in-progress') {
      return res.status(400).json({ msg: 'Attempt is not in progress' });
    }

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;

    for (const ans of attempt.answers) {
      const question = await Question.findById(ans.question);
      if (question) {
        maxScore += question.score;
        if (
          ans.selectedOption !== undefined &&
          question.options[ans.selectedOption]?.isCorrect
        ) {
          totalScore += question.score;
        }
      }
    }

    // Update attempt
    attempt.status = 'force_submitted';
    attempt.submissionType = 'warning_limit';
    attempt.endTime = new Date();
    attempt.score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    attempt.isPassed = attempt.score >= attempt.exam.passingScore;

    await attempt.save();

    res.json(attempt);
  } catch (err) {
    console.error('Error force submitting attempt:', err);
    res.status(500).send('Server error');
  }
};
