import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import { sendPushNotification } from '../services/pushService.js';
import NotificationLog from '../models/NotificationLog.js';

// Initialize the worker that listens to 'pushQueue'
export const pushWorker = new Worker(
    'pushQueue',
    async (job) => {
        const { to, subject, text, logId } = job.data;
        
        console.log(`\n==============================================`);
        console.log(`🚀 [Push Worker] PICKED UP JOB ${job.id}`);
        console.log(`📱 Token: ${to}`);
        console.log(`🔔 Title: ${subject}`);
        console.log(`==============================================\n`);
        
        // Mark as PROCESSING if we have a logId
        if (logId) {
            await NotificationLog.findByIdAndUpdate(logId, { status: 'PROCESSING' });
        }
        
        try {
            const result = await sendPushNotification({ token: to, title: subject, body: text, logId });
            console.log(`✅ [Push Worker] SUCCESS Job ${job.id}: Push delivered to ${to}! MessageId: ${result.messageId}`);
            
            if (logId) {
                await NotificationLog.findByIdAndUpdate(logId, { 
                    status: 'DELIVERED', // FCM gives immediate delivery confirmation
                    messageId: result.messageId 
                });
            }
            return true;
        } catch (error) {
            console.error(`❌ [Push Worker] CRASH in Job ${job.id}:`, error);
            
            if (logId) {
                await NotificationLog.findByIdAndUpdate(logId, { 
                    status: 'FAILED', 
                    errorMessage: error.message 
                });
            }
            throw error; // Let BullMQ handle retries
        }
    },
    {
        connection: createRedisConnection(),
        concurrency: 10 // FCM APIs can handle higher concurrency than SMTP
    }
);

pushWorker.on('failed', (job, err) => {
    console.error(`\n🚨 [Push Worker] BULLMQ JOB FAILED for ${job?.data?.to}:`, err.message, `\n`);
});

console.log('👷 Push Background Worker started and listening for jobs...');
