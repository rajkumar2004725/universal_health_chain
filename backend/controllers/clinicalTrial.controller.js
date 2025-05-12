import ClinicalTrial from '../models/ClinicalTrial.js';
import User from '../models/User.js';
import { AppError } from '../middleware/error.js';
import blockchainService from '../services/blockchain.service.js';
import ipfsService from '../services/ipfs.service.js';
import { encryptData, decryptData } from '../utils/encryption.js';
import logger from '../utils/logger.js';

// Create a new clinical trial
export const createTrial = async (req, res, next) => {
    try {
        const {
            title,
            description,
            criteria,
            compensation,
            startDate,
            endDate
        } = req.body;

        // Create trial in database
        const trial = await ClinicalTrial.create({
            title,
            description,
            criteria,
            compensation,
            startDate,
            endDate,
            researcher: req.user._id,
            status: 'RECRUITING'
        });

        // Store trial data on blockchain
        const trialHash = await blockchainService.addClinicalTrial(
            trial._id.toString(),
            req.user.blockchainAddress
        );

        // Update trial with blockchain info
        trial.blockchain = {
            transactionHash: trialHash.transactionHash,
            blockNumber: trialHash.blockNumber
        };
        await trial.save();

        res.status(201).json({
            status: 'success',
            data: trial
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get all trials
export const getAllTrials = async (req, res, next) => {
    try {
        const trials = await ClinicalTrial.find()
            .populate('researcher', 'username profile')
            .select('-blockchain');

        res.status(200).json({
            status: 'success',
            data: trials
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get specific trial
export const getTrial = async (req, res, next) => {
    try {
        const trial = await ClinicalTrial.findById(req.params.trialId)
            .populate('researcher', 'username profile')
            .populate('participants.user', 'username profile');

        if (!trial) {
            return next(new AppError('Trial not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: trial
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Update trial
export const updateTrial = async (req, res, next) => {
    try {
        const { status, participants } = req.body;
        const trial = await ClinicalTrial.findById(req.params.trialId);

        if (!trial) {
            return next(new AppError('Trial not found', 404));
        }

        // Verify researcher
        if (trial.researcher.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized to update this trial', 403));
        }

        // Update trial
        trial.status = status || trial.status;
        if (participants) {
            trial.participants = participants;
        }

        await trial.save();

        res.status(200).json({
            status: 'success',
            data: trial
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Apply for trial
const applyForTrial = async (req, res, next) => {
    try {
        const trial = await ClinicalTrial.findById(req.params.trialId);

        if (!trial) {
            return next(new AppError('Trial not found', 404));
        }

        if (trial.status !== 'RECRUITING') {
            return next(new AppError('Trial is not recruiting', 400));
        }

        // Check if already applied
        const alreadyApplied = trial.participants.some(
            p => p.user.toString() === req.user._id.toString()
        );

        if (alreadyApplied) {
            return next(new AppError('Already applied to this trial', 400));
        }

        // Add participant
        trial.participants.push({
            user: req.user._id,
            status: 'PENDING',
            joinedAt: new Date()
        });

        await trial.save();

        res.status(200).json({
            status: 'success',
            message: 'Successfully applied to trial'
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Submit trial data
const submitTrialData = async (req, res, next) => {
    try {
        const { data, participantId } = req.body;
        const trial = await ClinicalTrial.findById(req.params.trialId);

        if (!trial) {
            return next(new AppError('Trial not found', 404));
        }

        // Verify participant
        const participant = trial.participants.find(
            p => p.user.toString() === participantId
        );

        if (!participant) {
            return next(new AppError('Participant not found', 404));
        }

        // Encrypt and store data
        const encryptedData = await encryptionService.encrypt(JSON.stringify(data));
        const ipfsResult = await ipfsService.uploadFile(
            encryptedData,
            'application/json',
            { trialId: trial._id, participantId }
        );

        // Store data reference
        participant.dataPoints.push({
            ipfsHash: ipfsResult.ipfsHash,
            encryptionKey: ipfsResult.encryptionKey,
            timestamp: new Date()
        });

        await trial.save();

        res.status(200).json({
            status: 'success',
            message: 'Trial data submitted successfully'
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get trial analytics
const getTrialAnalytics = async (req, res, next) => {
    try {
        const trial = await ClinicalTrial.findById(req.params.trialId);

        if (!trial) {
            return next(new AppError('Trial not found', 404));
        }

        // Calculate analytics
        const analytics = {
            totalParticipants: trial.participants.length,
            activeParticipants: trial.participants.filter(p => p.status === 'ACTIVE').length,
            completedParticipants: trial.participants.filter(p => p.status === 'COMPLETED').length,
            totalDataPoints: trial.participants.reduce((acc, p) => acc + p.dataPoints.length, 0),
            averageDataPointsPerParticipant: trial.participants.length > 0
                ? trial.participants.reduce((acc, p) => acc + p.dataPoints.length, 0) / trial.participants.length
                : 0
        };

        res.status(200).json({
            status: 'success',
            data: analytics
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get participant data
const getParticipantData = async (req, res, next) => {
    try {
        const { trialId, participantId } = req.params;
        const trial = await ClinicalTrial.findById(trialId);

        if (!trial) {
            return next(new AppError('Trial not found', 404));
        }

        const participant = trial.participants.find(
            p => p.user.toString() === participantId
        );

        if (!participant) {
            return next(new AppError('Participant not found', 404));
        }

        // Get and decrypt all data points
        const dataPoints = await Promise.all(
            participant.dataPoints.map(async dp => {
                const encryptedData = await ipfsService.getFile(dp.ipfsHash);
                const decryptedData = await encryptionService.decrypt(
                    encryptedData,
                    dp.encryptionKey
                );
                return {
                    data: JSON.parse(decryptedData),
                    timestamp: dp.timestamp
                };
            })
        );

        res.status(200).json({
            status: 'success',
            data: {
                participant: await User.findById(participantId).select('username profile'),
                dataPoints
            }
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

export default {
    createTrial,
    getAllTrials,
    getTrial,
    updateTrial,
    applyForTrial,
    submitTrialData,
    getTrialAnalytics,
    getParticipantData
};
