import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

export const registerUser = async (userData) => {
    const { name, email, password } = userData;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password
    });

    if (user) {
        return {
            user,
            token: generateToken(user._id)
        };
    } else {
        throw new Error('Invalid user data');
    }
};

export const loginUser = async (email, password) => {
    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.comparePassword(password))) {
        return {
            user,
            token: generateToken(user._id)
        };
    } else {
        throw new Error('Invalid email or password');
    }
};

export const getUserProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};
