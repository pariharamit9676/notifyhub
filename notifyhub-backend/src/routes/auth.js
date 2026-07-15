import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../services/authService.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply strict rate limiting to all authentication routes
router.use(authLimiter);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const result = await registerUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await getUserProfile(req.user._id);
        res.json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

export default router;
