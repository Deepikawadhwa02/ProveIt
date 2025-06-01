const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  answers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      selectedOption: {
        type: Number  // Index of selected option
      }
    }
  ],
  score: {
    type: Number
  },
  isPassed: {
    type: Boolean
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'terminated', 'force_submitted'],
    default: 'in-progress'
  },
  submissionReason: {
    type: String,
    enum: ['user_submitted', 'time_expired', 'forced_warning_limit'],
    default: 'user_submitted'
  },
  warningCount: {
    type: Number,
    default: 0
  },
  submissionType: {
    type: String,
    enum: ['normal', 'timeout', 'warning_limit'],
    default: 'normal'
  }
});

module.exports = mongoose.model('Attempt', AttemptSchema);