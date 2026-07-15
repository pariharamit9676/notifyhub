import mongoose from 'mongoose';

const unsubscribeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    }
}, { timestamps: true });

const Unsubscribe = mongoose.model('Unsubscribe', unsubscribeSchema);

export default Unsubscribe;
