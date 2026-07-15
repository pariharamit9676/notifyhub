import express from 'express';
import { emailQueue } from '../queues/notificationQueue.js';
import { pushQueue } from '../queues/pushQueue.js';
import { protect } from '../middleware/auth.js'; // Assuming you want it protected, but for now we can leave it open or use protect
import NotificationLog from '../models/NotificationLog.js';

const router = express.Router();

const getQueue = (name) => {
    return name === 'push' ? pushQueue : emailQueue;
};

// GET /api/queue/stats
router.get('/stats', async (req, res) => {
    try {
        const queue = getQueue(req.query.queue);
        // Use getJobCounts to get an accurate picture of all states
        const counts = await queue.getJobCounts();
        const isPausedStatus = await queue.isPaused();

        res.json({
            // Waiting should include actual waiting, prioritized (which is where priority jobs sit), and paused
            waiting: counts.waiting + counts.prioritized + counts.paused,
            active: counts.active,
            completed: counts.completed,
            failed: counts.failed,
            delayed: counts.delayed,
            paused: isPausedStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/queue/jobs/:type
// type can be 'waiting', 'active', 'completed', 'failed', 'delayed'
router.get('/jobs/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const start = parseInt(req.query.start) || 0;
        const end = parseInt(req.query.end) || 50;
        
        const validTypes = ['waiting', 'active', 'completed', 'failed', 'delayed'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid job type' });
        }

        const queue = getQueue(req.query.queue);
        const jobs = await queue.getJobs([type], start, end);
        const formattedJobs = jobs.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            failedReason: job.failedReason,
            opts: job.opts,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            timestamp: job.timestamp
        }));

        res.json(formattedJobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/queue/pause
router.post('/pause', async (req, res) => {
    try {
        const queue = getQueue(req.query.queue);
        await queue.pause();
        res.json({ message: 'Queue paused successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/queue/resume
router.post('/resume', async (req, res) => {
    try {
        const queue = getQueue(req.query.queue);
        await queue.resume();
        res.json({ message: 'Queue resumed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/queue/job/:id/retry
router.post('/job/:id/retry', async (req, res) => {
    try {
        const queue = getQueue(req.query.queue);
        const job = await queue.getJob(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.isFailed()) {
            await job.retry();
            return res.json({ message: 'Job retried successfully' });
        }
        res.status(400).json({ error: 'Job is not in a failed state' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/queue/job/:id
router.delete('/job/:id', async (req, res) => {
    try {
        const queue = getQueue(req.query.queue);
        const job = await queue.getJob(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        // Fix: Update MongoDB so the Analytics 'In Queue' count decreases
        if (job.data && job.data.logId) {
            await NotificationLog.findByIdAndUpdate(job.data.logId, { 
                status: 'DROPPED', 
                errorMessage: 'Job was cancelled from Queue Manager' 
            });
        }
        
        await job.remove();
        res.json({ message: 'Job removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
