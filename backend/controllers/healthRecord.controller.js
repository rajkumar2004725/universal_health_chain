import HealthRecord from '../models/HealthRecord.js';
import blockchainService from '../services/blockchain.service.js';
import { encryptData, decryptData } from '../utils/encryption.js';
import { validateHealthRecord } from '../utils/validation.js';

export const createHealthRecord = async (req, res) => {
    try {
        const { patientId, recordType, data } = req.body;

        // Validate record data
        const validationError = validateHealthRecord(data, recordType);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Encrypt sensitive data
        const encryptedData = encryptData(data);

        // Create health record
        const healthRecord = new HealthRecord({
            patientId,
            recordType,
            data: encryptedData,
            metadata: {
                createdBy: req.user._id,
                facility: req.user.professionalInfo.organization
            },
            encryptionKey: encryptedData.key,
            accessControl: {
                allowedUsers: [patientId, req.user._id],
                allowedRoles: ['ADMIN']
            }
        });

        // Save to blockchain
        const tx = await blockchainService.addHealthRecord(
            healthRecord._id.toString(),
            patientId,
            req.user.blockchainAddress
        );

        // Update blockchain info
        healthRecord.blockchain = {
            transactionHash: tx.transactionHash,
            blockNumber: tx.blockNumber,
            timestamp: new Date()
        };

        await healthRecord.save();

        res.status(201).json({
            message: 'Health record created successfully',
            recordId: healthRecord._id,
            blockchain: healthRecord.blockchain
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create health record' });
    }
};

export const getHealthRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const healthRecord = await HealthRecord.findById(recordId);

        if (!healthRecord) {
            return res.status(404).json({ error: 'Health record not found' });
        }

        // Check access permission
        const hasAccess = await blockchainService.verifyAccess(
            recordId,
            req.user.blockchainAddress
        );

        if (!hasAccess && 
            !healthRecord.accessControl.allowedUsers.includes(req.user._id.toString()) &&
            !healthRecord.accessControl.allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Decrypt data
        const decryptedData = decryptData(
            healthRecord.data,
            healthRecord.encryptionKey
        );

        // Return record with decrypted data
        res.json({
            ...healthRecord.toObject(),
            data: decryptedData
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve health record' });
    }
};

export const updateHealthRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { data } = req.body;

        const healthRecord = await HealthRecord.findById(recordId);

        if (!healthRecord) {
            return res.status(404).json({ error: 'Health record not found' });
        }

        // Verify creator or admin
        if (healthRecord.metadata.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized to update this record' });
        }

        // Encrypt updated data
        const encryptedData = encryptData(data);

        // Update record
        healthRecord.data = encryptedData;
        healthRecord.encryptionKey = encryptedData.key;
        healthRecord.metadata.timestamp = new Date();

        await healthRecord.save();

        res.json({
            message: 'Health record updated successfully',
            recordId: healthRecord._id
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update health record' });
    }
};

export const grantAccess = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { userId } = req.body;

        const healthRecord = await HealthRecord.findById(recordId);

        if (!healthRecord) {
            return res.status(404).json({ error: 'Health record not found' });
        }

        // Verify ownership
        if (healthRecord.patientId !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the patient can grant access' });
        }

        // Grant access on blockchain
        await blockchainService.grantAccess(
            recordId,
            userId,
            req.user.blockchainAddress
        );

        // Update access control
        if (!healthRecord.accessControl.allowedUsers.includes(userId)) {
            healthRecord.accessControl.allowedUsers.push(userId);
            await healthRecord.save();
        }

        res.json({
            message: 'Access granted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to grant access' });
    }
};

export const revokeAccess = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { userId } = req.body;

        const healthRecord = await HealthRecord.findById(recordId);

        if (!healthRecord) {
            return res.status(404).json({ error: 'Health record not found' });
        }

        // Verify ownership
        if (healthRecord.patientId !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the patient can revoke access' });
        }

        // Revoke access on blockchain
        await blockchainService.revokeAccess(
            recordId,
            userId,
            req.user.blockchainAddress
        );

        // Update access control
        healthRecord.accessControl.allowedUsers = 
            healthRecord.accessControl.allowedUsers.filter(id => id !== userId);
        await healthRecord.save();

        res.json({
            message: 'Access revoked successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke access' });
    }
};

export const getPatientRecords = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { type, startDate, endDate } = req.query;

        // Build query
        const query = { patientId, status: 'ACTIVE' };
        if (type) query.recordType = type;
        if (startDate || endDate) {
            query['metadata.timestamp'] = {};
            if (startDate) query['metadata.timestamp'].$gte = new Date(startDate);
            if (endDate) query['metadata.timestamp'].$lte = new Date(endDate);
        }

        // Check access permission
        if (req.user._id.toString() !== patientId && 
            req.user.role !== 'ADMIN') {
            const hasAccess = await blockchainService.verifyAccess(
                patientId,
                req.user.blockchainAddress
            );
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const records = await HealthRecord.find(query)
            .sort({ 'metadata.timestamp': -1 });

        // Decrypt records data
        const decryptedRecords = records.map(record => ({
            ...record.toObject(),
            data: decryptData(record.data, record.encryptionKey)
        }));

        res.json(decryptedRecords);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve patient records' });
    }
};
