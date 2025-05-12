import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize, verifyBlockchainAddress } from '../middleware/auth.js';
import * as healthRecordController from '../controllers/healthRecord.controller.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Get all health records (simplified for testing)
router.get('/',
    (req, res) => {
        res.json([
            {
                id: '1',
                patientId: req.user?._id || 'patient1',
                recordType: 'DIAGNOSIS',
                provider: 'Dr. Smith',
                date: '2025-04-15',
                data: {
                    diagnosis: 'Common Cold',
                    notes: 'Rest and fluids recommended',
                    medications: ['Acetaminophen']
                },
                blockchainRef: '0x123abc...'
            },
            {
                id: '2',
                patientId: req.user?._id || 'patient1',
                recordType: 'LAB_RESULT',
                provider: 'City Labs',
                date: '2025-04-10',
                data: {
                    test: 'Blood Panel',
                    results: {
                        hemoglobin: '14.2 g/dL',
                        whiteBloodCells: '7.5 K/uL',
                        platelets: '250 K/uL'
                    }
                },
                blockchainRef: '0x456def...'
            }
        ]);
    }
);

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
    (req, res) => {
        // Mock implementation for development
        const { patientId, recordType, provider, data } = req.body;
        
        // Generate a random ID for the new record
        const recordId = Math.floor(Math.random() * 10000).toString();
        
        // Return success response with created record
        res.status(201).json({
            id: recordId,
            patientId: patientId || req.user?._id || 'patient1',
            recordType: recordType || 'DIAGNOSIS',
            provider: provider || 'Dr. Smith',
            date: new Date().toISOString().split('T')[0],
            data: data || { diagnosis: 'Sample Diagnosis' },
            blockchainRef: `0x${Math.random().toString(36).substring(2, 15)}`,
            createdAt: new Date().toISOString()
        });
    }
);

// Get specific health record
router.get('/:recordId',
    (req, res) => {
        const recordId = req.params.recordId;
        
        // Return mock health record data
        res.json({
            id: recordId,
            patientId: req.user?._id || 'patient1',
            recordType: 'DIAGNOSIS',
            provider: 'Dr. Smith',
            date: '2025-05-01',
            data: {
                diagnosis: 'Seasonal Allergy',
                notes: 'Patient presented with nasal congestion and itchy eyes',
                medications: ['Loratadine 10mg', 'Fluticasone nasal spray'],
                followUp: '2 weeks'
            },
            blockchainRef: `0x${Math.random().toString(36).substring(2, 15)}`,
            createdAt: '2025-05-01T10:30:00Z',
            updatedAt: '2025-05-01T10:30:00Z'
        });
    }
);

// Get health records by doctor
router.get('/doctor/:doctorId', (req, res) => {
  const { doctorId } = req.params;
  // Mock implementation for development
  const records = [
    {
      id: '1',
      patientId: req.user?._id || 'patient1',
      recordType: 'DIAGNOSIS',
      provider: 'Dr. Smith',
      date: '2025-04-15',
      data: {
        diagnosis: 'Common Cold',
        notes: 'Rest and fluids recommended',
        medications: ['Acetaminophen']
      },
      blockchainRef: '0x123abc...',
      accessList: ['doctor1', 'nurse1']
    },
    {
      id: '2',
      patientId: req.user?._id || 'patient1',
      recordType: 'LAB_RESULT',
      provider: 'City Labs',
      date: '2025-04-10',
      data: {
        test: 'Blood Panel',
        results: {
          hemoglobin: '14.2 g/dL',
          whiteBloodCells: '7.5 K/uL',
          platelets: '250 K/uL'
        }
      },
      blockchainRef: '0x456def...',
      accessList: ['doctor1']
    }
  ].filter(record => 
    record.provider === doctorId || record.accessList.includes(doctorId)
  );
  res.json(records);
});

// Update health record
router.put('/:recordId',
    [
        body('data').notEmpty()
    ],
    (req, res) => {
        // Mock implementation for development
        const recordId = req.params.recordId;
        const { data, recordType, provider } = req.body;
        
        // Return success response with updated record
        res.json({
            id: recordId,
            patientId: req.user?._id || 'patient1',
            recordType: recordType || 'UPDATED_RECORD',
            provider: provider || 'Updated Provider',
            date: new Date().toISOString().split('T')[0],
            data: data || { updated: true },
            blockchainRef: `0x${Math.random().toString(36).substring(2, 15)}`,
            updatedAt: new Date().toISOString()
        });
    }
);

// Grant access to health record
router.post('/:recordId/grant-access',
    [
        body('userId').notEmpty()
    ],
    (req, res) => {
        const { recordId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'UserId is required' });
        }
        
        // Mock implementation for development
        // In a real implementation, we would update the database and blockchain
        
        // Return success response
        res.json({
            message: 'Access granted successfully',
            recordId,
            userId,
            timestamp: new Date().toISOString()
        });
    }
);

// Revoke access to health record
router.post('/:recordId/revoke-access',
    [
        body('userId').notEmpty()
    ],
    (req, res) => {
        const { recordId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'UserId is required' });
        }
        
        // Mock implementation for development
        // In a real implementation, we would update the database and blockchain
        
        // Return success response
        res.json({
            message: 'Access revoked successfully',
            recordId,
            userId,
            timestamp: new Date().toISOString()
        });
    }
);

// Get all records for a patient
router.get('/patient/:patientId',
    authorize('DOCTOR', 'HEALTHCARE_PROVIDER', 'ADMIN', 'PATIENT'),
    healthRecordController.getPatientRecords
);

export default router;
