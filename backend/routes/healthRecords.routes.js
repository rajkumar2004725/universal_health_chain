import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize, verifyBlockchainAddress } from '../middleware/auth.js';
import * as healthRecordController from '../controllers/healthRecord.controller.js';

const router = express.Router();

// Middleware to check if user has blockchain address
router.use(authenticate, verifyBlockchainAddress);

// Create health record
router.post('/',
    [
        body('patientId').notEmpty(),
        body('recordType').isIn([
            'DIAGNOSIS',
            'PRESCRIPTION',
            'LAB_RESULT',
            'VACCINATION',
            'SURGERY',
            'OTHER'
        ]),
        body('data').notEmpty()
    ],
    authorize('DOCTOR', 'HEALTHCARE_PROVIDER', 'ADMIN'),
    healthRecordController.createHealthRecord
);

// Get specific health record
router.get('/:recordId',
    healthRecordController.getHealthRecord
);

// Update health record
router.put('/:recordId',
    [
        body('data').notEmpty()
    ],
    authorize('DOCTOR', 'HEALTHCARE_PROVIDER', 'ADMIN'),
    healthRecordController.updateHealthRecord
);

// Grant access to health record
router.post('/:recordId/grant-access',
    [
        body('userId').notEmpty()
    ],
    healthRecordController.grantAccess
);

// Revoke access to health record
router.post('/:recordId/revoke-access',
    [
        body('userId').notEmpty()
    ],
    healthRecordController.revokeAccess
);

// Get all records for a patient
router.get('/patient/:patientId',
    authorize('DOCTOR', 'HEALTHCARE_PROVIDER', 'ADMIN', 'PATIENT'),
    healthRecordController.getPatientRecords
);

export default router;
