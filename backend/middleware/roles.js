import User from '../models/User.js';
import logger from '../utils/logger.js';

export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'ADMIN') {
            next();
        } else {
            logger.warn(`Unauthorized admin access attempt by user: ${req.user.userId}`);
            res.status(403).json({ message: 'Admin access required' });
        }
    } catch (error) {
        logger.error('Role verification error:', error);
        res.status(500).json({ message: 'Error verifying role', error: error.message });
    }
};

export const isHealthcareProvider = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && (user.role === 'DOCTOR' || user.role === 'HEALTHCARE_PROVIDER' || user.role === 'ADMIN')) {
            next();
        } else {
            logger.warn(`Unauthorized healthcare provider access attempt by user: ${req.user.userId}`);
            res.status(403).json({ message: 'Healthcare provider access required' });
        }
    } catch (error) {
        logger.error('Role verification error:', error);
        res.status(500).json({ message: 'Error verifying role', error: error.message });
    }
};

export const hasRole = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            if (user && roles.includes(user.role)) {
                next();
            } else {
                logger.warn(`Unauthorized role access attempt by user: ${req.user.userId}`);
                res.status(403).json({ message: 'Required role access not found' });
            }
        } catch (error) {
            logger.error('Role verification error:', error);
            res.status(500).json({ message: 'Error verifying role', error: error.message });
        }
    };
};
