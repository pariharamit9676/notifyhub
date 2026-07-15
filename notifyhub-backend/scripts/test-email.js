import { sendEmail } from './src/services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const testSingleEmail = async () => {
    try {
        console.log('Testing SMTP connection by sending a test email...');
        const result = await sendEmail({
            to: process.env.SMTP_USER,
            subject: 'Test Email from NotifyHub',
            text: 'If you are reading this, your SMTP connection is working perfectly!',
            html: '<b>If you are reading this, your SMTP connection is working perfectly!</b>'
        });
        console.log('✅ Email sent successfully:', result);
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed to send email:', e);
        process.exit(1);
    }
};

testSingleEmail();
