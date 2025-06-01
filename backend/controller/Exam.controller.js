// const Exam = require('../models/Exam');
// const Question = require('../models/Question');
// const Attempt = require('../models/Attempt');
// //const emailService = require('../services/email.service');
// const User = require('../models/User');

// // @route   POST /api/exams
// // @desc    Create a new exam
// // @access  Private (Admin/Examiner)
// exports.createExam = async (req, res) => {
//   try {
//     const { title, description, duration, passingScore, allowRetake, retakeAfterDays } = req.body;

//     // Only admin/examiner can create exams
//     if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
//       return res.status(403).json({ msg: 'Not authorized' });
//     }

//     const newExam = new Exam({
//       title,
//       description,
//       duration,
//       passingScore,
//       allowRetake,
//       retakeAfterDays,
//       createdBy: req.user.id
//     });

//     const exam = await newExam.save();

//     // Send notification to all students
//     const students = await User.find({ role: 'student' });
//     await emailService.sendNewExamNotification(students, exam);

//     res.json(exam);
//   } catch (err) {
//     console.error(err.message);const Exam = require('../models/Exam');
//     const Question = require('../models/Question');
//     const Attempt = require('../models/Attempt');
//     //const emailService = require('../services/email.service');
//     const User = require('../models/User');
    
//     // @route   POST /api/exams
//     // @desc    Create a new exam
//     // @access  Private (Admin/Examiner)
//     exports.createExam = async (req, res) => {
//       try {
//         const { title, description, duration, passingScore, allowRetake, retakeAfterDays } = req.body;
    
//         // Only admin/examiner can create exams
//         if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
//           return res.status(403).json({ msg: 'Not authorized' });
//         }
    
//         const newExam = new Exam({
//           title,
//           description,
//           duration,
//           passingScore,
//           allowRetake,
//           retakeAfterDays,
//           createdBy: req.user.id
//         });
    
//         const exam = await newExam.save();
    
//         // Send notification to all students
//         // Comment out the email notification line
//         // const students = await User.find({ role: 'student' });
//         // await emailService.sendNewExamNotification(students, exam);
    
//         res.json(exam);
//       } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server error');
//       }
//     };
    
//     // Other methods remain unchanged...
    
//     res.status(500).send('Server error');
//   }
// };

// // @route   GET /api/exams
// // @desc    Get all exams
// // @access  Private
// exports.getExams = async (req, res) => {
//   try {
//     let exams;

//     // Admin/Examiner can see all exams
//     if (req.user.role === 'admin' || req.user.role === 'examiner') {
//       exams = await Exam.find().sort({ createdAt: -1 });
//     } else {
//       // Students can only see active exams
//       exams = await Exam.find({ isActive: true }).sort({ createdAt: -1 });
//     }

//     res.json(exams);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// // @route   GET /api/exams/:id
// // @desc    Get exam by ID
// // @access  Private
// exports.getExam = async (req, res) => {
//   try {
//     const exam = await Exam.findById(req.params.id);


//     if (!exam) {
//       return res.status(404).json({ msg: 'Exam not found' });
//     }

//     // Check if exam is active for students
//     if (req.user.role === 'student' && !exam.isActive) {
//       return res.status(403).json({ msg: 'Exam not available' });
//     }

//     res.json(exam);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// // @route   POST /api/exams/:id/questions
// // @desc    Add questions to an exam
// // @access  Private (Admin/Examiner)
// exports.addQuestions = async (req, res) => {
//   try {
//     const exam = await Exam.findById(req.params.id);

//     if (!exam) {
//       return res.status(404).json({ msg: 'Exam not found' });
//     }

//     // Only admin/examiner can add questions
//     if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
//       return res.status(403).json({ msg: 'Not authorized' });
//     }

//     const { questions } = req.body;

//     const questionsToInsert = questions.map(q => ({
//       examId: exam._id,
//       text: q.text,
//       options: q.options,
//       score: q.score || 1
//     }));

//     const savedQuestions = await Question.insertMany(questionsToInsert);

//     res.json(savedQuestions);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// // @route   GET /api/exams/:id/questions
// // @desc    Get randomized questions for an exam
// // @access  Private
// exports.getExamQuestions = async (req, res) => {
//   try {
//     const exam = await Exam.findById(req.params.id);

//     if (!exam) {
//       return res.status(404).json({ msg: 'Exam not found' });
//     }

//     // If student is taking the exam, randomize the questions
//     let questions;
//     if (req.user.role === 'student') {
//       // Check if user has an active attempt
//       const activeAttempt = await Attempt.findOne({
//         user: req.user.id,
//         exam: exam._id,
//         status: 'in-progress'
//       });

//       if (!activeAttempt) {
//         return res.status(400).json({ msg: 'No active attempt found' });
//       }

//       // Get randomized questions
//       questions = await Question.aggregate([
//         { $match: { examId: exam._id } },
//         { $sample: { size: await Question.countDocuments({ examId: exam._id }) } }
//       ]);

//       // Remove correct answers for student
//       questions = questions.map(q => ({
//         ...q,
//         options: q.options.map(opt => ({
//           text: opt.text,
//           _id: opt._id
//         }))
//       }));
//     } else {
//       // For admin/examiner, show all questions with answers
//       questions = await Question.find({ examId: exam._id });
//     }

//     res.json(questions);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// exports.toggleExamActivation = async (req, res) => {
//   try {
//     const { isActive } = req.body;

//     // Only admin/examiner can update exam activation
//     if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
//       return res.status(403).json({ msg: 'Not authorized' });
//     }

//     const exam = await Exam.findById(req.params.id);

//     if (!exam) {
//       return res.status(404).json({ msg: 'Exam not found' });
//     }

//     // Check if user is authorized to update this exam
//     if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user.id) {
//       return res.status(403).json({ msg: 'Not authorized to modify this exam' });
//     }

//     exam.isActive = isActive;
//     await exam.save();

//     res.json(exam);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// // @route   GET /api/exams/created-by-me
// // @desc    Get all exams created by the current user
// // @access  Private (Admin/Examiner)
// exports.getMyCreatedExams = async (req, res) => {
//   try {
//     // Only admin/examiner can access this
//     if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
//       return res.status(403).json({ msg: 'Not authorized' });
//     }

//     const exams = await Exam.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

//     res.json(exams);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// // @route   PUT /api/exams/:id
// // @desc    Update an exam
// // @access  Private (Admin/Examiner)
// exports.updateExam = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       duration,
//       passingScore,
//       allowRetake,
//       retakeAfterDays
//     } = req.body;

//     // Only admin/examiner can update exams
//     if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
//       return res.status(403).json({ msg: 'Not authorized' });
//     }

//     const exam = await Exam.findById(req.params.id);

//     if (!exam) {
//       return res.status(404).json({ msg: 'Exam not found' });
//     }

//     // Check if user is authorized to update this exam
//     if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user.id) {
//       return res.status(403).json({ msg: 'Not authorized to modify this exam' });
//     }

//     // Update fields
//     if (title) exam.title = title;
//     if (description) exam.description = description;
//     if (duration) exam.duration = duration;
//     if (passingScore) exam.passingScore = passingScore;
//     if (allowRetake !== undefined) exam.allowRetake = allowRetake;
//     if (retakeAfterDays) exam.retakeAfterDays = retakeAfterDays;

//     await exam.save();

//     res.json(exam);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
// const emailService = require('../services/email.service');
const User = require('../models/User');

// @route   POST /api/exams
// @desc    Create a new exam
// @access  Private (Admin/Examiner)
exports.createExam = async (req, res) => {
  try {
    const { title, description, duration, passingScore, allowRetake, retakeAfterDays } = req.body;

    // Only admin/examiner can create exams
    if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const newExam = new Exam({
      title,
      description,
      duration,
      passingScore,
      allowRetake,
      retakeAfterDays,
      createdBy: req.user.id
    });

    const exam = await newExam.save();

    // Removed email notification section

    res.json(exam);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/exams
// @desc    Get all exams
// @access  Private
exports.getExams = async (req, res) => {
  try {
    let exams;

    // Admin/Examiner can see all exams
    if (req.user.role === 'admin' || req.user.role === 'examiner') {
      exams = await Exam.find().sort({ createdAt: -1 });
    } else {
      // Students can only see active exams
      exams = await Exam.find({ isActive: true }).sort({ createdAt: -1 });
    }

    res.json(exams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/exams/:id
// @desc    Get exam by ID
// @access  Private
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ msg: 'Exam not found' });
    }

    // Check if exam is active for students
    if (req.user.role === 'student' && !exam.isActive) {
      return res.status(403).json({ msg: 'Exam not available' });
    }

    res.json(exam);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST /api/exams/:id/questions
// @desc    Add questions to an exam
// @access  Private (Admin/Examiner)
exports.addQuestions = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ msg: 'Exam not found' });
    }

    // Only admin/examiner can add questions
    if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { questions } = req.body;

    const questionsToInsert = questions.map(q => ({
      examId: exam._id,
      text: q.text,
      options: q.options,
      score: q.score || 1
    }));

    const savedQuestions = await Question.insertMany(questionsToInsert);

    res.json(savedQuestions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/exams/:id/questions
// @desc    Get randomized questions for an exam
// @access  Private
exports.getExamQuestions = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ msg: 'Exam not found' });
    }

    // If student is taking the exam, randomize the questions
    let questions;
    if (req.user.role === 'student') {
      const activeAttempt = await Attempt.findOne({
        user: req.user.id,
        exam: exam._id,
        status: 'in-progress'
      });

      if (!activeAttempt) {
        return res.status(400).json({ msg: 'No active attempt found' });
      }

      questions = await Question.aggregate([
        { $match: { examId: exam._id } },
        { $sample: { size: await Question.countDocuments({ examId: exam._id }) } }
      ]);

      questions = questions.map(q => ({
        ...q,
        options: q.options.map(opt => ({
          text: opt.text,
          _id: opt._id
        }))
      }));
    } else {
      questions = await Question.find({ examId: exam._id });
    }

    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.toggleExamActivation = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ msg: 'Exam not found' });
    }

    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to modify this exam' });
    }

    exam.isActive = isActive;
    await exam.save();

    res.json(exam);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/exams/created-by-me
// @desc    Get all exams created by the current user
// @access  Private (Admin/Examiner)
exports.getMyCreatedExams = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const exams = await Exam.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

    res.json(exams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   PUT /api/exams/:id
// @desc    Update an exam
// @access  Private (Admin/Examiner)
exports.updateExam = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      passingScore,
      allowRetake,
      retakeAfterDays
    } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'examiner') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ msg: 'Exam not found' });
    }

    if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to modify this exam' });
    }

    if (title) exam.title = title;
    if (description) exam.description = description;
    if (duration) exam.duration = duration;
    if (passingScore) exam.passingScore = passingScore;
    if (allowRetake !== undefined) exam.allowRetake = allowRetake;
    if (retakeAfterDays) exam.retakeAfterDays = retakeAfterDays;

    await exam.save();

    res.json(exam);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
