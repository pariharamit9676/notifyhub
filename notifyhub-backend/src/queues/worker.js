import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import { sendEmail } from '../services/emailService.js';
import NotificationLog from '../models/NotificationLog.js';
import Unsubscribe from '../models/Unsubscribe.js';
import { getIO } from '../config/socket.js';

// Initialize the worker that listens to 'emailQueue'
export const emailWorker = new Worker(
    'emailQueue',
    async (job) => {
        const { to, subject, text, html, logId } = job.data;
        
        console.log(`\n==============================================`);
        console.log(`🚀 [Worker] PICKED UP JOB ${job.id}`);
        console.log(`📩 Recipient: ${to}`);
        console.log(`📝 Subject: ${subject}`);
        console.log(`==============================================\n`);
        
        // 1. Check if user is unsubscribed
        const isUnsubscribed = await Unsubscribe.findOne({ email: to.toLowerCase() });
        if (isUnsubscribed) {
            console.log(`🚫 [Worker] Skipped sending to ${to} (Unsubscribed)`);
            if (logId) {
                await NotificationLog.findByIdAndUpdate(logId, { 
                    status: 'DROPPED', 
                    errorMessage: 'User has unsubscribed' 
                });
            }
            return true; // End job successfully without sending
        }

        // 2. Append Unsubscribe link to HTML
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
        const unsubscribeLink = `<br><br><div style="font-size:12px; color:#666; text-align:center; padding-top:20px; border-top:1px solid #eee; margin-top:20px;">
            Don't want to receive these emails? <a href="${backendUrl}/api/unsubscribe?email=${encodeURIComponent(to)}">Unsubscribe here</a>
        </div>`;
        const finalHtml = (html || '') + unsubscribeLink;
        
        // 3. Mark as PROCESSING if we have a logId
        if (logId) {
            await NotificationLog.findByIdAndUpdate(logId, { status: 'PROCESSING' });
        }
        
        try {
            const result = await sendEmail({ to, subject, text, html: finalHtml, logId });
            console.log(`✅ [Worker] SUCCESS Job ${job.id}: Email delivered to ${to}! MessageId: ${result.messageId}`);
            
            if (logId) {
                await NotificationLog.findByIdAndUpdate(logId, { 
                    status: 'SENT', 
                    messageId: result.messageId 
                });
            }
            return true;
        } catch (error) {
            console.error(`❌ [Worker] CRASH in Job ${job.id}:`, error);
            
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
        concurrency: 5
    }
);

emailWorker.on('completed', (job) => {
    const io = getIO();
    if (io) io.emit('queueUpdate');
});

emailWorker.on('failed', (job, err) => {
    console.error(`\n🚨 [Worker] BULLMQ JOB FAILED for ${job?.data?.to}:`, err.message, `\n`);
    const io = getIO();
    if (io) io.emit('queueUpdate');
});

emailWorker.on('active', () => {
    const io = getIO();
    if (io) io.emit('queueUpdate');
});

console.log('👷 Background Worker started and listening for jobs...');
