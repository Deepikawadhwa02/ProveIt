const mongoose = require('mongoose');

const ViolationSchema = new mongoose.Schema({
    attempt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attempt',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['tab_switch', 'copy_paste', 'right_click'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    warningCount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Violation', ViolationSchema); 