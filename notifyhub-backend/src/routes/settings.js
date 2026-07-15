import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// @route   GET /api/settings/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/settings/profile
// @desc    Update user name
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters.' });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name: name.trim() },
            { new: true }
        ).select('-password');
        res.json({ message: 'Profile updated successfully!', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/settings/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
