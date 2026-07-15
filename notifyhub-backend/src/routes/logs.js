import express from 'express';
import { protect } from '../middleware/auth.js';
import NotificationLog from '../models/NotificationLog.js';

const router = express.Router();

// @route   GET /api/logs
// @desc    Get all notification logs for a user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const logs = await NotificationLog.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(500); // Fetch latest 500 logs to prevent massive payloads
            
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @route   GET /api/logs/stats
// @desc    Get summary statistics for the user
// @access  Private
router.get('/stats', protect, async (req, res) => {
    try {
        const stats = await NotificationLog.aggregate([
            { $match: { user: req.user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const summary = {
            total: 0,
            queued: 0,
            processing: 0,
            sent: 0,
            delivered: 0,
            failed: 0,
            bounced: 0,
            dropped: 0,
            deferred: 0,
            opened: 0,
            clicked: 0
        };

        stats.forEach(stat => {
            const status = stat._id.toLowerCase();
            if (summary[status] !== undefined) {
                summary[status] = stat.count;
            } else {
                // In case there's an older unexpected status, just add it dynamically
                summary[status] = stat.count;
            }
            summary.total += stat.count;
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;
