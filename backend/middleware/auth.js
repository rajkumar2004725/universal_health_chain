import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/User.js';
import ErrorResponse from '../utils/errorResponse.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.userId);

        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ error: 'Invalid authentication' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid authentication' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'You do not have permission to perform this action' 
            });
        }
        next();
    };
};

export const verifyBlockchainAddress = async (req, res, next) => {
    try {
        if (!req.user.blockchainAddress) {
            return res.status(400).json({ 
                error: 'Blockchain address not registered' 
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
