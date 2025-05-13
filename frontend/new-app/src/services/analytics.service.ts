import api from './api';

export interface AnalyticsData {
    timeframe: string;
    data: Record<string, any>;
}

export interface TransactionHistoryItem {
    timestamp: string;
    transactions: number;
    gasUsed: number;
    [key: string]: any;
}

export interface TrialAnalytics {
    enrollmentRate: number;
    completionRate: number;
    adverseEvents: number;
    dataQualityScore: number;
    demographics: {
        ageDistribution: Record<string, number>;
        genderDistribution: Record<string, number>;
        ethnicityDistribution: Record<string, number>;
    };
    outcomes: {
        primaryEndpoints: Record<string, number>;
        secondaryEndpoints: Record<string, number>;
        safetyMetrics: Record<string, number>;
    };
}

export interface HealthSystemAnalytics {
    patientMetrics: {
        totalPatients: number;
        activePatients: number;
        newPatients: number;
        demographicDistribution: Record<string, number>;
    };
    providerMetrics: {
        totalProviders: number;
        specialtyDistribution: Record<string, number>;
        patientLoad: Record<string, number>;
    };
    recordMetrics: {
        totalRecords: number;
        recordTypes: Record<string, number>;
        accessPatterns: Record<string, number>;
    };
    blockchainMetrics: {
        totalTransactions: number;
        averageResponseTime: number;
        consensusParticipation: number;
    };
}

class AnalyticsService {
    // Clinical Trial Analytics
    async getTrialAnalytics(trialId: string): Promise<TrialAnalytics> {
        try {
            const response = await api.get('/analytics/trial-stats', {
                params: { trialId }
            });
            return response.data.stats;
        } catch (error) {
            console.error('Error fetching trial analytics:', error);
            // Return mock data as fallback
            return {
                enrollmentRate: 78.5,
                completionRate: 92.3,
                adverseEvents: 12,
                dataQualityScore: 87.6,
                demographics: {
                    ageDistribution: {
                        '18-30': 25,
                        '31-45': 40,
                        '46-60': 28,
                        '61+': 7
                    },
                    genderDistribution: {
                        'Male': 48,
                        'Female': 52
                    },
                    ethnicityDistribution: {
                        'Caucasian': 65,
                        'African American': 15,
                        'Hispanic': 12,
                        'Asian': 8
                    }
                },
                outcomes: {
                    primaryEndpoints: {
                        'Efficacy': 76.8,
                        'Safety': 94.2
                    },
                    secondaryEndpoints: {
                        'Quality of Life': 82.5,
                        'Biomarker Changes': 68.9
                    },
                    safetyMetrics: {
                        'Serious Adverse Events': 3,
                        'Non-serious Adverse Events': 9
                    }
                }
            };
        }
    }

    async getTrialTrends(trialId: string, timeframe: string): Promise<AnalyticsData> {
        const response = await api.get(`/analytics/trials/${trialId}/trends`, {
            params: { timeframe }
        });
        return response.data;
    }

    async getAdverseEventAnalytics(trialId: string): Promise<any> {
        const response = await api.get(`/analytics/trials/${trialId}/adverse-events`);
        return response.data;
    }

    // Health System Analytics
    async getSystemAnalytics(): Promise<HealthSystemAnalytics> {
        try {
            const response = await api.get('/analytics/health-stats');
            return response.data.stats;
        } catch (error) {
            console.error('Error fetching health system analytics:', error);
            // Return mock data as fallback
            return {
                patientMetrics: {
                    totalPatients: 1250,
                    activePatients: 980,
                    newPatients: 75,
                    demographicDistribution: {
                        '18-30': 320,
                        '31-45': 450,
                        '46-60': 280,
                        '61+': 200
                    }
                },
                providerMetrics: {
                    totalProviders: 180,
                    specialtyDistribution: {
                        'Cardiology': 35,
                        'Neurology': 28,
                        'Pediatrics': 42,
                        'Other': 75
                    },
                    patientLoad: {
                        'Low': 45,
                        'Medium': 95,
                        'High': 40
                    }
                },
                recordMetrics: {
                    totalRecords: 1450,
                    recordTypes: {
                        'lab-results': 425,
                        'medications': 380,
                        'diagnoses': 290,
                        'procedures': 210,
                        'imaging': 145
                    },
                    accessPatterns: {
                        'patient': 620,
                        'provider': 780,
                        'third-party': 50
                    }
                },
                blockchainMetrics: {
                    totalTransactions: 2450,
                    averageResponseTime: 0.8,
                    consensusParticipation: 95
                }
            };
        }
    }

    async getPatientAnalytics(patientId: string): Promise<any> {
        const response = await api.get(`/analytics/patients/${patientId}`);
        return response.data;
    }

    async getProviderAnalytics(providerId: string): Promise<any> {
        const response = await api.get(`/analytics/providers/${providerId}`);
        return response.data;
    }

    // Blockchain Analytics
    async getBlockchainMetrics(): Promise<any> {
        try {
            const response = await api.get('/analytics/user-stats');
            return response.data.blockchain;
        } catch (error) {
            console.error('Error fetching blockchain metrics:', error);
            // Return mock data as fallback
            return {
                totalTransactions: 3450,
                averageResponseTime: 0.65,
                consensusParticipation: 97.8,
                transactionsByType: {
                    'record-creation': 1250,
                    'record-access': 1850,
                    'access-control': 350
                },
                gasUsage: {
                    'daily': 125000,
                    'weekly': 875000,
                    'monthly': 3750000
                },
                networkHealth: 98.5
            };
        }
    }

    async getTransactionHistory(timeframe: string): Promise<TransactionHistoryItem[]> {
        try {
            const response = await api.get('/analytics/user-stats', {
                params: { timeframe }
            });
            const history = response.data.transactionHistory;
            return Array.isArray(history) ? history : [];
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            // Return mock data as fallback
            return [
                { timestamp: '2023-05-01', transactions: 120, gasUsed: 45000 },
                { timestamp: '2023-05-02', transactions: 145, gasUsed: 52000 },
                { timestamp: '2023-05-03', transactions: 135, gasUsed: 48000 },
                { timestamp: '2023-05-04', transactions: 160, gasUsed: 58000 },
                { timestamp: '2023-05-05', transactions: 190, gasUsed: 67000 },
                { timestamp: '2023-05-06', transactions: 175, gasUsed: 62000 },
                { timestamp: '2023-05-07', transactions: 150, gasUsed: 54000 }
            ];
        }
    }

    // Privacy-Preserving Analytics
    async getAggregatedData(query: {
        metrics: string[];
        filters: Record<string, any>;
        privacyLevel: number;
    }): Promise<any> {
        const response = await api.post('/analytics/aggregated', query);
        return response.data;
    }

    async getFederatedAnalytics(query: {
        model: string;
        parameters: Record<string, any>;
    }): Promise<any> {
        const response = await api.post('/analytics/federated', query);
        return response.data;
    }

    // Export Functions
    async exportAnalytics(params: {
        type: string;
        format: 'CSV' | 'JSON' | 'PDF';
        timeframe: string;
    }): Promise<Blob> {
        const response = await api.get('/analytics/export', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }

    async generateReport(params: {
        type: string;
        templateId: string;
        data: Record<string, any>;
    }): Promise<Blob> {
        const response = await api.post('/analytics/report', params, {
            responseType: 'blob'
        });
        return response.data;
    }

    // Real-time Analytics
    subscribeToMetrics(callback: (data: any) => void) {
        const eventSource = new EventSource('/api/analytics/stream');
        eventSource.onmessage = (event) => {
            callback(JSON.parse(event.data));
        };
        return () => eventSource.close();
    }

    // Predictive Analytics
    async getPredictions(params: {
        model: string;
        features: Record<string, any>;
    }): Promise<any> {
        const response = await api.post('/analytics/predict', params);
        return response.data;
    }

    async trainModel(params: {
        model: string;
        data: Record<string, any>;
        config: Record<string, any>;
    }): Promise<any> {
        const response = await api.post('/analytics/train', params);
        return response.data;
    }
}

export default new AnalyticsService();
