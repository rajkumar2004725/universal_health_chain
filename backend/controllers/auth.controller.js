import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import contractService from '../services/contract.service.js';

export const register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user in database
        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: role || 'patient'
        });
        await user.save();

        // Register user identity on blockchain
        const accounts = await contractService.web3.eth.getAccounts();
        const from = accounts[0]; // Using first account as admin
        await contractService.registerIdentity(
            user._id.toString(),
            user.role,
            { name: user.name, email: user.email },
            from
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        logger.info(`User registered successfully: ${user.email}`);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify blockchain identity
        const isVerified = await contractService.verifyIdentity(user._id.toString());
        if (!isVerified) {
            logger.warn(`User ${user.email} blockchain identity verification failed`);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        logger.info(`User logged in successfully: ${user.email}`);
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        if (name) user.name = name;
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        await user.save();
        logger.info(`Profile updated for user: ${user.email}`);
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};
