import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        default: ''
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'push'],
        required: true
    },
    status: {
        type: String,
        enum: ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'DROPPED', 'DEFERRED', 'OPENED', 'CLICKED'],
        default: 'QUEUED'
    },
    messageId: {
        type: String
    },
    errorMessage: {
        type: String
    }
}, { timestamps: true });

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
