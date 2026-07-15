import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'push'],
        required: true,
        default: 'email'
    },
    description: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        default: ''
    },
    body: {
        type: String,
        required: true
    },
    variables: [{
        type: String
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Template', templateSchema);
