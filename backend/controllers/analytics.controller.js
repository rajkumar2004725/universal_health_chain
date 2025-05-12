import HealthRecord from '../models/HealthRecord.js';
import User from '../models/User.js';
import { AppError } from '../middleware/error.js';
import logger from '../utils/logger.js';

// Get epidemiological data with privacy preservation
const getEpidemiologyData = async (req, res, next) => {
    try {
        const { region, startDate, endDate, condition } = req.query;

        // Aggregate health records with privacy controls
        const data = await HealthRecord.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    },
                    'data.condition': condition,
                    'metadata.region': region
                }
            },
            {
                $group: {
                    _id: {
                        region: '$metadata.region',
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                // Implement k-anonymity
                $having: { count: { $gte: 5 } }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get pandemic tracking data
const getPandemicTrackingData = async (req, res, next) => {
    try {
        const { disease, region, timeframe } = req.query;

        const data = await HealthRecord.aggregate([
            {
                $match: {
                    'data.condition': disease,
                    'metadata.region': region,
                    createdAt: {
                        $gte: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        region: '$metadata.region'
                    },
                    newCases: { $sum: 1 },
                    severity: { $avg: '$data.severity' }
                }
            },
            {
                $sort: { '_id.date': 1 }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get healthcare provider analytics
const getProviderAnalytics = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const { startDate, endDate } = req.query;

        const analytics = await HealthRecord.aggregate([
            {
                $match: {
                    'metadata.provider': providerId,
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: '$recordType',
                    count: { $sum: 1 },
                    uniquePatients: { $addToSet: '$patientId' }
                }
            },
            {
                $project: {
                    recordType: '$_id',
                    count: 1,
                    uniquePatientCount: { $size: '$uniquePatients' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: analytics
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get regional health statistics
const getRegionalStats = async (req, res, next) => {
    try {
        const { region } = req.query;

        const stats = await HealthRecord.aggregate([
            {
                $match: {
                    'metadata.region': region
                }
            },
            {
                $group: {
                    _id: '$data.condition',
                    count: { $sum: 1 },
                    averageAge: {
                        $avg: {
                            $subtract: [
                                new Date(),
                                '$metadata.patientDateOfBirth'
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    condition: '$_id',
                    count: 1,
                    averageAge: {
                        $divide: [
                            { $subtract: ['$averageAge', 0] },
                            365 * 24 * 60 * 60 * 1000
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get preventive care insights
const getPreventiveCareInsights = async (req, res, next) => {
    try {
        const insights = await HealthRecord.aggregate([
            {
                $match: {
                    recordType: 'PREVENTIVE_CARE'
                }
            },
            {
                $group: {
                    _id: '$data.intervention',
                    effectiveness: {
                        $avg: '$data.effectiveness'
                    },
                    participationRate: {
                        $sum: {
                            $cond: [{ $eq: ['$data.participated', true] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: insights
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get population health metrics
const getPopulationHealthMetrics = async (req, res, next) => {
    try {
        const { ageGroup, gender, region } = req.query;

        const metrics = await HealthRecord.aggregate([
            {
                $match: {
                    'metadata.patientAgeGroup': ageGroup,
                    'metadata.patientGender': gender,
                    'metadata.region': region
                }
            },
            {
                $group: {
                    _id: '$data.condition',
                    prevalence: { $sum: 1 },
                    averageSeverity: { $avg: '$data.severity' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: metrics
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get AI-driven health predictions
const getHealthPredictions = async (req, res, next) => {
    try {
        const { region, timeframe } = req.query;

        // This would integrate with a machine learning service
        // For now, we'll return mock predictions
        const predictions = {
            diseaseOutbreaks: [
                {
                    disease: 'Influenza',
                    probability: 0.75,
                    expectedCases: 1000,
                    timeline: '2 weeks'
                }
            ],
            resourceNeeds: {
                hospitalBeds: 500,
                icu: 50,
                ventilators: 20
            },
            riskAreas: [
                {
                    location: 'District A',
                    riskLevel: 'HIGH',
                    factors: ['population density', 'age distribution']
                }
            ]
        };

        res.status(200).json({
            status: 'success',
            data: predictions
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Get quality metrics
const getQualityMetrics = async (req, res, next) => {
    try {
        const { providerId } = req.query;

        const metrics = await HealthRecord.aggregate([
            {
                $match: {
                    'metadata.provider': providerId
                }
            },
            {
                $group: {
                    _id: null,
                    totalPatients: { $addToSet: '$patientId' },
                    averageTreatmentTime: { $avg: '$metadata.treatmentDuration' },
                    readmissionRate: {
                        $avg: {
                            $cond: [{ $eq: ['$data.isReadmission', true] }, 1, 0]
                        }
                    },
                    patientSatisfaction: { $avg: '$data.satisfaction' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalPatients: { $size: '$totalPatients' },
                    averageTreatmentTime: 1,
                    readmissionRate: 1,
                    patientSatisfaction: 1
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: metrics[0] || {}
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

export default {
    getEpidemiologyData,
    getPandemicTrackingData,
    getProviderAnalytics,
    getRegionalStats,
    getPreventiveCareInsights,
    getPopulationHealthMetrics,
    getHealthPredictions,
    getQualityMetrics
};
