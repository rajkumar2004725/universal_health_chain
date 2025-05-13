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

// Get health statistics
router.get('/health-stats',
    authorize('HEALTHCARE_PROVIDER', 'ADMIN', 'PATIENT'),
    async (req, res) => {
        try {
            // Get time period from query params or use default
            const period = req.query.period || 'month';
            const userId = req.query.userId || req.user._id;
            
            // In a real implementation, you would fetch this data from your database
            // For now, we'll return mock data
            res.json({
                success: true,
                period,
                userId,
                stats: {
                    vitalSigns: {
                        averageHeartRate: 72,
                        averageBloodPressure: '120/80',
                        averageBloodGlucose: 95,
                        averageTemperature: 98.6
                    },
                    healthMetrics: {
                        bmi: 24.5,
                        bodyFatPercentage: 18.2,
                        cholesterolLevels: {
                            total: 185,
                            hdl: 55,
                            ldl: 110
                        }
                    },
                    activityData: {
                        averageStepsPerDay: 8500,
                        averageCaloriesBurned: 2200,
                        averageSleepHours: 7.5
                    },
                    medicalVisits: {
                        total: 3,
                        byType: {
                            'routine-checkup': 1,
                            'specialist': 1,
                            'emergency': 0,
                            'follow-up': 1
                        }
                    }
                },
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error fetching health stats:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch health statistics' });
        }
    }
);

// Get trial statistics
router.get('/trial-stats',
    authorize('RESEARCHER', 'ADMIN', 'HEALTHCARE_PROVIDER'),
    async (req, res) => {
        try {
            // Get trial ID from query params
            const trialId = req.query.trialId;
            
            // In a real implementation, you would fetch this data from your database
            // For now, we'll return mock data
            res.json({
                success: true,
                trialId: trialId || 'all-trials',
                stats: {
                    participantMetrics: {
                        total: 120,
                        active: 98,
                        completed: 15,
                        withdrawn: 7,
                        demographics: {
                            ageGroups: [
                                { group: '18-30', count: 25 },
                                { group: '31-45', count: 42 },
                                { group: '46-60', count: 38 },
                                { group: '61+', count: 15 }
                            ],
                            gender: {
                                male: 65,
                                female: 53,
                                other: 2
                            }
                        }
                    },
                    outcomeMetrics: {
                        primaryEndpoints: {
                            success: 72,
                            failure: 12,
                            inconclusive: 14,
                            pending: 22
                        },
                        secondaryEndpoints: {
                            success: 68,
                            failure: 15,
                            inconclusive: 17,
                            pending: 20
                        }
                    },
                    adverseEvents: {
                        total: 8,
                        severe: 1,
                        moderate: 3,
                        mild: 4
                    },
                    complianceRate: 94.5,
                    dataQualityScore: 92.3
                },
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error fetching trial stats:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch trial statistics' });
        }
    }
);

// Get user statistics
router.get('/user-stats',
    authorize('ADMIN', 'HEALTHCARE_PROVIDER'),
    async (req, res) => {
        try {
            // Get time period from query params
            const period = req.query.period || 'month';
            
            // In a real implementation, you would fetch this data from your database
            // For now, we'll return mock data
            res.json({
                success: true,
                period,
                stats: {
                    userCounts: {
                        total: 1250,
                        active: 980,
                        newUsers: 75,
                        byRole: {
                            patient: 950,
                            doctor: 180,
                            researcher: 45,
                            admin: 15,
                            other: 60
                        }
                    },
                    engagement: {
                        averageSessionDuration: '8m 45s',
                        averageSessionsPerUser: 12.3,
                        mostActiveTimeOfDay: '10:00-12:00',
                        mostUsedFeatures: [
                            { feature: 'health-records', usageCount: 4250 },
                            { feature: 'messaging', usageCount: 3180 },
                            { feature: 'appointments', usageCount: 2340 },
                            { feature: 'prescriptions', usageCount: 1980 }
                        ]
                    },
                    platformUsage: {
                        web: 65,
                        mobile: 30,
                        api: 5
                    },
                    geographicDistribution: [
                        { region: 'North America', userCount: 580 },
                        { region: 'Europe', userCount: 320 },
                        { region: 'Asia', userCount: 250 },
                        { region: 'Other', userCount: 100 }
                    ]
                },
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch user statistics' });
        }
    }
);

export default router;
