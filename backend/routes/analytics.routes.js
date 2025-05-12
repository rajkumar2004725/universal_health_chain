import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import analyticsController from '../controllers/analytics.controller.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

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

export default router;
