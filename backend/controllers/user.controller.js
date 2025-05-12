import User from '../models/User.js';
import logger from '../utils/logger.js';
import contractService from '../services/contract.service.js';

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        logger.error('Get all users error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error('Get user by id error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only admin can change roles
        if (role && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to change role' });
        }

        // Update user fields
        if (name) user.name = name;
        if (role) user.role = role;
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        // Update blockchain identity if role changed
        if (role && role !== user.role) {
            const accounts = await contractService.web3.eth.getAccounts();
            const from = accounts[0]; // Using first account as admin
            await contractService.registerIdentity(
                user._id.toString(),
                role,
                { name: user.name, email: user.email },
                from
            );
        }

        await user.save();
        logger.info(`User updated: ${user.email}`);
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting own account
        if (req.user.userId === req.params.id) {
            return res.status(400).json({ message: 'Cannot delete own account' });
        }

        await user.deleteOne();
        logger.info(`User deleted: ${user.email}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { query, role } = req.query;
        let searchQuery = {};

        if (query) {
            searchQuery.$or = [
                { name: new RegExp(query, 'i') },
                { email: new RegExp(query, 'i') }
            ];
        }

        if (role) {
            searchQuery.role = role;
        }

        const users = await User.find(searchQuery).select('-password');
        res.json(users);
    } catch (error) {
        logger.error('Search users error:', error);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
};
