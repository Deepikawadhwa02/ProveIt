const schedule = require('node-schedule');
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const emailService = require('./email.service');

class SchedulerService {
    constructor() {
        // Run every day at midnight
        schedule.scheduleJob('0 0 * * *', this.checkInactiveUsers);
    }

    async checkInactiveUsers() {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            // Find users who haven't taken any exams in the last week
            const inactiveUsers = await User.find({
                role: 'student',
                lastActive: { $lt: oneWeekAgo }
            });

            // Send reminders
            for (const user of inactiveUsers) {
                await emailService.sendInactivityReminder(user);
            }
        } catch (error) {
            console.error('Error checking inactive users:', error);
        }
    }
}

module.exports = new SchedulerService(); 