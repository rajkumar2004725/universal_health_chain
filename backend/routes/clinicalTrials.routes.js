import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import clinicalTrialController from '../controllers/clinicalTrial.controller.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create clinical trial
router.post('/',
    [
        body('title').notEmpty(),
        body('description').notEmpty(),
        body('criteria').isArray(),
        body('compensation').isNumeric(),
        body('startDate').isISO8601(),
        body('endDate').isISO8601()
    ],
    authorize('RESEARCHER', 'ADMIN'),
    clinicalTrialController.createTrial
);

// Get all trials
router.get('/',
    clinicalTrialController.getAllTrials
);

// Get specific trial
router.get('/:trialId',
    clinicalTrialController.getTrial
);

// Update trial
router.put('/:trialId',
    [
        body('status').isIn(['RECRUITING', 'ACTIVE', 'COMPLETED', 'SUSPENDED']),
        body('participants').optional().isArray()
    ],
    authorize('RESEARCHER', 'ADMIN'),
    clinicalTrialController.updateTrial
);

// Apply for trial
router.post('/:trialId/apply',
    authorize('PATIENT'),
    clinicalTrialController.applyForTrial
);

// Submit trial data
router.post('/:trialId/data',
    [
        body('data').notEmpty(),
        body('participantId').notEmpty()
    ],
    authorize('RESEARCHER', 'HEALTHCARE_PROVIDER'),
    clinicalTrialController.submitTrialData
);

// Get trial analytics
router.get('/:trialId/analytics',
    authorize('RESEARCHER', 'ADMIN'),
    clinicalTrialController.getTrialAnalytics
);

// Get participant data
router.get('/:trialId/participants/:participantId',
    authorize('RESEARCHER', 'HEALTHCARE_PROVIDER'),
    clinicalTrialController.getParticipantData
);

export default router;
