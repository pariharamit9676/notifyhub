import { addBulkEmailJobs } from './src/queues/notificationQueue.js';
import dotenv from 'dotenv';
dotenv.config();

const testQueue = async () => {
    try {
        console.log('Testing BullMQ connection...');
        await addBulkEmailJobs([
            { to: 'test@example.com', subject: 'Test', text: 'Test text', html: 'Test html' }
        ]);
        console.log('Successfully added job to queue');
        process.exit(0);
    } catch (e) {
        console.error('Failed to add job to queue:', e);
        process.exit(1);
    }
};

testQueue();
