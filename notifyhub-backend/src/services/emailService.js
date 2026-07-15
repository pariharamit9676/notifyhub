import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import axios from 'axios';
import { CircuitBreaker, CircuitOpenError } from '../utils/CircuitBreaker.js';

let transporter;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

// Create a circuit breaker for MailBluster (Trip after 3 failures, wait 60 seconds)
const mailblusterBreaker = new CircuitBreaker(async (to, subject, html, fromEmail) => {
    await axios.post('https://api.mailbluster.com/api/leads', {
        email: to,
        firstName: to.split('@')[0],
        subscribed: true,
        tags: ['NotifyHub_Bulk']
    }, {
        headers: { 'Authorization': process.env.MAILBUSTER_API_KEY }
    });

    await axios.post('https://api.mailbluster.com/api/campaigns', {
        name: `NotifyHub - ${subject}`,
        type: 'regular',
        sender_name: 'NotifyHub',
        sender_email: fromEmail.replace(/".*"\s+</, '').replace('>', ''),
        subject: subject,
        body: html,
        recipients: [to]
    }, {
        headers: { 'Authorization': process.env.MAILBUSTER_API_KEY }
    });
}, { failureThreshold: 3, timeout: 60000 });

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @param {string} text - Plain text fallback
 * @param {string} logId - Optional database NotificationLog ID for webhook tracking
 */
export const sendEmail = async ({ to, subject, html, text, logId }) => {
    try {
        const fromEmail = process.env.EMAIL_FROM || '"NotifyHub" <noreply@notifyhub.com>';
        
        // 1. Use MailBluster if API Key is provided
        if (process.env.MAILBUSTER_API_KEY) {
            try {
                // The circuit breaker handles the API calls. If it's OPEN, it instantly throws CircuitOpenError.
                await mailblusterBreaker.fire(to, subject, html, fromEmail);
                
                console.log(`✅ Email sent via MailBluster: ${to}`);
                return { success: true, messageId: `mailbluster_${Date.now()}` };
            } catch (mbError) {
                if (mbError instanceof CircuitOpenError) {
                    console.log(`⚠️ MailBluster Circuit OPEN. Fast failing to next provider (SendGrid).`);
                } else {
                    console.error('❌ Error sending via MailBluster API:', mbError.response?.data || mbError.message);
                }
                // Do not throw here. Allow it to fall through to SendGrid (Failover).
            }
        }

        // 2. Use SendGrid if API Key is provided
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
            const msg = {
                to,
                from: fromEmail,
                subject,
                text: text || 'This email requires HTML support.',
                html,
            };
            
            if (logId) {
                msg.customArgs = { logId: logId.toString() };
            }

            const [response] = await sgMail.send(msg);
            const messageId = response.headers['x-message-id'] || 'sendgrid_sent';
            console.log(`✅ Email sent via SendGrid: ${messageId}`);
            return { success: true, messageId };
        } 
        
        // 3. Fallback to Nodemailer
        const mailOptions = {
            from: fromEmail,
            to,
            subject,
            text: text || 'This email requires HTML support.',
            html,
        };

        const info = await getTransporter().sendMail(mailOptions);
        
        if (info.rejected && info.rejected.length > 0) {
            console.error(`❌ Email rejected by SMTP server for: ${info.rejected.join(', ')}`);
            throw new Error(`Email rejected for: ${info.rejected.join(', ')}`);
        }

        console.log(`✅ Email sent via Nodemailer: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error.response?.body || error.message);
        throw new Error('Failed to send email');
    }
};

export default { sendEmail };
