import fs from 'fs';
import express from 'express';
import NotificationLog from '../models/NotificationLog.js';
import { EventWebhook } from '@sendgrid/eventwebhook';

const router = express.Router();

// @route   POST /api/webhooks/sendgrid
// @desc    Receive SendGrid Event Webhooks
// @access  Public
router.post('/sendgrid', async (req, res) => {
    try {
        // SendGrid Signature Verification
        const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
        if (publicKey) {
            const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
            const timestamp = req.get('X-Twilio-Email-Event-Webhook-Timestamp');
            
            if (!signature || !timestamp || !req.rawBody) {
                console.error('[Webhook] Missing signature, timestamp, or rawBody');
                return res.status(401).send('Missing signature headers');
            }

            const verifyWebhook = new EventWebhook();
            try {
                const isValid = verifyWebhook.verifySignature(verifyWebhook.convertPublicKeyToECDSA(publicKey), req.rawBody, signature, timestamp);
                if (!isValid) {
                    console.error('[Webhook] Signature verification failed');
                    return res.status(401).send('Invalid signature');
                }
            } catch (err) {
                console.error('[Webhook] Error verifying signature:', err);
                return res.status(401).send('Invalid signature format');
            }
        } else {
            console.warn('[Webhook] Warning: SENDGRID_WEBHOOK_PUBLIC_KEY is not set. Skipping signature verification.');
        }

        const events = req.body;
        console.log("RECEIVED WEBHOOK:", JSON.stringify(events, null, 2));
        // Removed fs.appendFileSync to prevent file write errors on cloud hosting
        if (!Array.isArray(events)) {
            return res.status(400).send('Expected an array of events');
        }

        for (const event of events) {
            const { event: eventType, logId, email } = event;
            
            if (!logId) continue; // Ignore events that don't have our custom logId

            if (['bounce', 'dropped', 'deferred'].includes(eventType)) {
                await NotificationLog.findByIdAndUpdate(logId, {
                    status: eventType.toUpperCase(),
                    errorMessage: `SendGrid: ${eventType} - ${event.reason || 'No reason provided'}`
                });
                console.log(`[Webhook] Marked logId ${logId} (${email}) as ${eventType.toUpperCase()}`);
            } else if (eventType === 'delivered') {
                await NotificationLog.findByIdAndUpdate(logId, {
                    status: 'DELIVERED',
                });
                console.log(`[Webhook] Marked logId ${logId} (${email}) as DELIVERED`);
            } else if (eventType === 'click' || eventType === 'open') {
                await NotificationLog.findByIdAndUpdate(logId, {
                    status: eventType === 'click' ? 'CLICKED' : 'OPENED',
                });
                console.log(`[Webhook] ${eventType} event for logId ${logId} (${email})`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[Webhook] Error processing SendGrid webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
