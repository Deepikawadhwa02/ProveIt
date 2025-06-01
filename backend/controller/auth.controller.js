// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');

// // @route   POST /api/auth/register
// // @desc    Register a user
// // @access  Public
// exports.register = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const { name, email, password, role = 'student' } = req.body;

//     // Check if user exists
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ msg: 'User already exists' });
//     }

//     // Create new user
//     user = new User({
//       name,
//       email,
//       password,
//       role
//     });

//     await user.save();

//     // Create token
//     const payload = {
//       user: {
//         id: user.id,
//         role: user.role
//       }
//     };

//     const token = jwt.sign(
//       payload,
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '24h' }
//     );

//     res.json({
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (err) {
//     console.error('Registration error:', err.message);
//     res.status(500).send('Server error');
//   }
// };

// // @route   POST /api/auth/login
// // @desc    Authenticate user & get token
// // @access  Public
// exports.login = async (req, res) => {
//   console.log(req.body);

//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   const { email, password } = req.body;

//   try {
//     // Check if user exists
//     let user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ msg: 'Invalid credentials' });
//     }

//     // Check password
//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ msg: 'Invalid credentials' });
//     }

//     // Generate JWT
//     const payload = {
//       user: {
//         id: user.id,
//         role: user.role
//       }
//     };

//     jwt.sign(
//       payload,
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' },
//       (err, token) => {
//         if (err) throw err;
//         res.json({
//           token,
//           user: {
//             id: user.id,
//             name: user.name,
//             email: user.email,
//             role: user.role
//           }
//         });
//       }
//     );
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

// // @route   GET /api/auth/user
// // @desc    Get logged in user
// // @access  Private
// exports.getUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     res.json(user);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// };

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const sendMail = require('../utils/sendMail'); // ✅ import added

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role || 'student'
    });

    await user.save();

    // ✅ Send welcome email
    // await sendMail(
    //   user.email,
    //   'Welcome to InterviewPrep 🎉',
    //   `<h3>Hello ${user.name},</h3>
    //    <p>Thanks for signing up as a <strong>${user.role}</strong>!</p>
    //    <p>We’re excited to have you on board 🚀</p>`
    // );
    await sendMail(
      user.email,
      'Welcome to ProveIt 🎉',
      `<div style="font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
        <h3 style="color: #4CAF50;">Hello ${user.name},</h3>
        <p style="font-size: 18px;">Welcome aboard to <strong style="color: #FF9800;">PrepNinja</strong>! We're excited to have you as a <strong style="color: #FF5722;">${user.role}</strong>!</p>
        
        <p style="font-size: 16px; line-height: 1.6;">Get ready to sharpen your skills and prepare like a pro with our ninja-level resources. 🚀 Whether you're aiming to master interviews or gain valuable feedback, you're in the right place!</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #607d8b;">The journey to success starts now, and we can’t wait to see you crush it! 💼</p>
        
        <p style="font-size: 16px; font-weight: bold; color: #009688;">What's next?</p>
        <p style="font-size: 16px;">Keep an eye out for your first challenges and personalized tips coming your way soon. You're about to level up your interview game with PrepNinja!</p>
    
        <br>
        <p style="font-size: 16px; font-style: italic; color: #7b8b8c;">Here’s to your success and ninja moves!</p>
        <p style="font-size: 16px; color: #333;">Best regards, <br><strong style="color: #FF5722;">The Proveit Team</strong></p>
      </div>`
    );
    

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  console.log(req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET /api/auth/user
// @desc    Get logged in user
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
