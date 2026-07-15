import { emailQueue } from './src/queues/notificationQueue.js';
import dotenv from 'dotenv';
dotenv.config();

const checkQueue = async () => {
    try {
        const counts = await emailQueue.getJobCounts('wait', 'completed', 'failed', 'active', 'delayed');
        console.log('Queue Status:', counts);

        const failedJobs = await emailQueue.getFailed();
        if (failedJobs.length > 0) {
            console.log('Failed Jobs Count:', failedJobs.length);
            console.log('Last Failed Job Error:', failedJobs[0].failedReason);
        }

        process.exit(0);
    } catch (e) {
        console.error('Error checking queue:', e);
        process.exit(1);
    }
};

checkQueue();
