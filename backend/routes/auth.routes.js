import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import config from '../config/config.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register',
    [
        body('username').trim().isLength({ min: 3 }),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('role').isIn(['PATIENT', 'DOCTOR', 'ADMIN', 'HEALTHCARE_PROVIDER'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, email, password, role, profile } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    error: 'User already exists' 
                });
            }

            // Create new user
            const user = new User({
                username,
                email,
                password,
                role,
                profile
            });

            await user.save();

            // Generate token
            const token = jwt.sign(
                { userId: user._id }, 
                config.jwt.secret, 
                { expiresIn: config.jwt.expiresIn }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Login user
router.post('/login',
    [
        body('username').trim().isLength({ min: 3 }),
        body('password').exists()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { username, password } = req.body;

            // Find user
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({ 
                    error: 'User not found' 
                });
            }
            
            if (user.status !== 'ACTIVE') {
                return res.status(401).json({ 
                    error: 'Account is not active' 
                });
            }

            // Verify password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ 
                    error: 'Invalid credentials' 
                });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user._id }, 
                config.jwt.secret, 
                { expiresIn: config.jwt.expiresIn }
            );

            res.json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['profile', 'professionalInfo'];
        
        // Filter out non-allowed updates
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
