import { addBulkEmailJobs } from './src/queues/notificationQueue.js';
import { Worker } from 'bullmq';
import redisConnection from './src/config/redis.js';
import { sendEmail } from './src/services/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

const testBulkSend = async () => {
    try {
        console.log('Adding a test bulk job directly to queue...');
        await addBulkEmailJobs([
            {
                to: process.env.SMTP_USER,
                subject: 'Test Bulk Queue Email',
                text: 'This is a test from the bulk queue system',
                html: '<b>This is a test from the bulk queue system</b>'
            }
        ]);
        console.log('Jobs added to queue!');

        // Run a local temporary worker to observe logs
        const tempWorker = new Worker(
            'emailQueue',
            async (job) => {
                const { to, subject, text, html } = job.data;
                console.log(`[TEMP WORKER] Processing job ${job.id}: Sending email to ${to}`);
                const res = await sendEmail({ to, subject, text, html });
                console.log(`[TEMP WORKER] Job ${job.id} completed successfully!`, res);
                return true;
            },
            { connection: redisConnection }
        );

        tempWorker.on('failed', (job, err) => {
            console.error(`[TEMP WORKER] Job ${job?.id} failed:`, err);
        });

        setTimeout(() => {
            console.log('Finished waiting');
            process.exit(0);
        }, 10000);
    } catch (e) {
        console.error('Error during bulk send test:', e);
        process.exit(1);
    }
};

testBulkSend();
