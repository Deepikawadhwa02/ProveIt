const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,  // Duration in minutes
    required: true
  },
  passingScore: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowRetake: {
    type: Boolean,
    default: true
  },
  retakeAfterDays: {
    type: Number,
    default: 7
  },
  category: {
    type: String,
    default: 'General'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exam', ExamSchema);