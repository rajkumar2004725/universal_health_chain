import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import analyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// System analytics
router.get('/system',
    authorize('ADMIN'),
    (req, res) => {
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date(),
            metrics: {
                activeUsers: 120,
                totalRecords: 1450,
                storageUsed: '2.3 GB',
                apiRequests: 15420,
                averageResponseTime: '120ms'
            }
        });
    }
);

// Blockchain transaction analytics
router.get('/blockchain/transactions',
    authorize('ADMIN', 'HEALTHCARE_PROVIDER'),
    (req, res) => {
        const timeframe = req.query.timeframe || '1w';
        res.json({
            timeframe,
            transactions: [
                { date: '2025-05-06', count: 42, type: 'record-access' },
                { date: '2025-05-07', count: 38, type: 'record-access' },
                { date: '2025-05-08', count: 56, type: 'record-access' },
                { date: '2025-05-09', count: 61, type: 'record-access' },
                { date: '2025-05-10', count: 44, type: 'record-access' },
                { date: '2025-05-11', count: 39, type: 'record-access' },
                { date: '2025-05-12', count: 47, type: 'record-access' }
            ],
            gasUsed: 1245000,
            averageBlockTime: '12s'
        });
    }
);

// Clinical trials analytics
router.get('/trials/all',
    authorize('RESEARCHER', 'ADMIN', 'HEALTHCARE_PROVIDER'),
    (req, res) => {
        res.json({
            totalTrials: 12,
            activeTrials: 8,
            completedTrials: 3,
            pendingTrials: 1,
            participantStats: {
                total: 342,
                active: 215,
                completed: 98,
                withdrawn: 29
            },
            trialsByType: [
                { type: 'Observational', count: 5 },
                { type: 'Interventional', count: 4 },
                { type: 'Expanded Access', count: 2 },
                { type: 'Other', count: 1 }
            ]
        });
    }
);

// Get epidemiological data
router.get('/epidemiology',
    authorize('HEALTHCARE_PROVIDER', 'RESEARCHER', 'ADMIN'),
    analyticsController.getEpidemiologyData
);

// Get pandemic tracking data
router.get('/pandemic-tracking',
    authorize('HEALTHCARE_PROVIDER', 'RESEARCHER', 'ADMIN'),
    analyticsController.getPandemicTrackingData
);

// Get healthcare provider analytics
router.get('/provider/:providerId',
    authorize('HEALTHCARE_PROVIDER', 'ADMIN'),
    analyticsController.getProviderAnalytics
);

// Get regional health statistics
router.get('/regional',
    authorize('HEALTHCARE_PROVIDER', 'RESEARCHER', 'ADMIN'),
    analyticsController.getRegionalStats
);

// Get preventive care insights
router.get('/preventive-care',
    authorize('HEALTHCARE_PROVIDER', 'RESEARCHER', 'ADMIN'),
    analyticsController.getPreventiveCareInsights
);

// Get population health metrics
router.get('/population-health',
    authorize('HEALTHCARE_PROVIDER', 'RESEARCHER', 'ADMIN'),
    analyticsController.getPopulationHealthMetrics
);

// Get AI-driven predictions
router.get('/predictions',
    authorize('HEALTHCARE_PROVIDER', 'RESEARCHER', 'ADMIN'),
    analyticsController.getHealthPredictions
);

// Get quality metrics
router.get('/quality-metrics',
    authorize('HEALTHCARE_PROVIDER', 'ADMIN'),
    analyticsController.getQualityMetrics
);

// Health records analytics
router.get('/health-records/summary',
    authorize('HEALTHCARE_PROVIDER', 'ADMIN'),
    (req, res) => {
        res.json({
            totalRecords: 1450,
            recordsByType: {
                'lab-results': 425,
                'medications': 380,
                'diagnoses': 290,
                'procedures': 210,
                'imaging': 145
            },
            accessStats: {
                patientAccess: 620,
                providerAccess: 780,
                thirdPartyAccess: 50
            },
            sharingStats: {
                shared: 320,
                private: 1130
            }
        });
    }
);

export default router;
