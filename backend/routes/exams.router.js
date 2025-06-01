const router = require('express').Router();

const { 
  createExam, 
  getExams, 
  getExam, 
  addQuestions, 
  getExamQuestions,
  toggleExamActivation,
  getMyCreatedExams,
  updateExam
} = require('../controller/Exam.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

router.route('/')
  .post(authMiddleware, createExam)
  .get(authMiddleware, getExams);

router.get('/created-by-me', authMiddleware, getMyCreatedExams);

router.route('/:id')
  .get(authMiddleware, getExam)
  .put(authMiddleware, updateExam);

router.route('/:id/activate')
  .put(authMiddleware, toggleExamActivation);

router.route('/:id/questions')
  .post(authMiddleware, addQuestions)
  .get(authMiddleware, getExamQuestions);

module.exports = router;