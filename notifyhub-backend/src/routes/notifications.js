import express from 'express';
import { sendEmail } from '../services/emailService.js';
import { addEmailJob, addBulkEmailJobs } from '../queues/notificationQueue.js';
import { addPushJob, addBulkPushJobs } from '../queues/pushQueue.js';
import { protect } from '../middleware/auth.js';
import { notificationLimiter } from '../middleware/rateLimiter.js';
import NotificationLog from '../models/NotificationLog.js';

const router = express.Router();

// @route   POST /api/notifications/send
// @desc    Send a notification (single or bulk)
// @access  Private
router.post('/send', protect, notificationLimiter, async (req, res) => {
    try {
        const { channel, sendMode, recipient, subject, body, bulkData, priority, scheduledTime } = req.body;

        if (channel !== 'email' && channel !== 'push') {
            return res.status(400).json({ message: `Channel ${channel} is not fully implemented yet.` });
        }

        if (sendMode === 'single') {
            if (!recipient || !subject || !body) {
                return res.status(400).json({ message: 'Missing recipient, subject, or body for single send.' });
            }
            
            // Create a single NotificationLog
            const logEntry = await NotificationLog.create({
                user: req.user._id,
                recipient,
                subject,
                channel: channel,
                status: 'PROCESSING'
            });

            // Send single via queue based on channel
            try {
                if (channel === 'email') {
                    await addEmailJob({
                        to: recipient,
                        subject: subject,
                        text: body,
                        html: body.replace(/\n/g, '<br>'),
                        logId: logEntry._id.toString()
                    }, priority, scheduledTime);
                } else if (channel === 'push') {
                    await addPushJob({
                        to: recipient, // device token
                        subject: subject, // title
                        text: body, // body
                        logId: logEntry._id.toString()
                    }, priority, scheduledTime);
                }
                
                
                return res.json({ message: scheduledTime ? 'Notification scheduled successfully!' : 'Notification queued successfully!' });
            } catch (err) {
                logEntry.status = 'FAILED';
                logEntry.errorMessage = err.message;
                await logEntry.save();
                throw err;
            }
        } else if (sendMode === 'bulk') {
            if (!bulkData || !Array.isArray(bulkData) || bulkData.length === 0) {
                return res.status(400).json({ message: 'Missing or empty bulk data.' });
            }

            // Create NotificationLog entries for tracking
            const logEntries = await NotificationLog.insertMany(bulkData.map(item => ({
                user: req.user._id,
                recipient: item.recipient,
                subject: item.subject,
                channel: channel,
                status: 'QUEUED'
            })));

            // Map bulk data to BullMQ job format and include the tracking logId
            const jobsArray = bulkData.map((item, index) => ({
                to: item.recipient,
                subject: item.subject,
                text: item.body || '',
                html: item.body ? item.body.replace(/\n/g, '<br>') : '',
                logId: logEntries[index]._id.toString()
            }));

            // Push ALL jobs to the queue instantly
            if (channel === 'email') {
                await addBulkEmailJobs(jobsArray, priority, scheduledTime);
            } else if (channel === 'push') {
                await addBulkPushJobs(jobsArray, priority, scheduledTime);
            }

            return res.json({
                message: `Successfully queued ${bulkData.length} notifications! The background worker will send them shortly.`,
                total: bulkData.length
            });
        } else {
            return res.status(400).json({ message: 'Invalid send mode.' });
        }
    } catch (error) {
        console.error('Error in send route:', error);
        res.status(500).json({ message: error.message || 'Server error while sending notification.' });
    }
});

export default router;
