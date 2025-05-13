import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import analyticsService from '../../services/analytics.service';
import { HealthSystemAnalytics, TrialAnalytics, TransactionHistoryItem } from '../../services/analytics.service';
import TrialMetricsCard from './TrialMetricsCard';
import PatientMetricsCard from './PatientMetricsCard';
import BlockchainMetricsCard from './BlockchainMetricsCard';

const AnalyticsDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [systemAnalytics, setSystemAnalytics] = useState<HealthSystemAnalytics | null>(null);
    const [trialAnalytics, setTrialAnalytics] = useState<TrialAnalytics | null>(null);
    const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch all analytics data in parallel
                const [systemData, trialData, txHistory] = await Promise.all([
                    analyticsService.getSystemAnalytics(),
                    analyticsService.getTrialAnalytics('all'),
                    analyticsService.getTransactionHistory('1w')
                ]);

                // Set state with the fetched data
                setSystemAnalytics(systemData);
                setTrialAnalytics(trialData);
                
                // Transaction history should already be an array of TransactionHistoryItem
                setTransactionHistory(txHistory);
                
                console.log('Analytics data loaded successfully');
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Analytics Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Trial Metrics */}
                <Grid item xs={12} md={4}>
                    <TrialMetricsCard analytics={trialAnalytics} />
                </Grid>

                {/* Patient Metrics */}
                <Grid item xs={12} md={4}>
                    <PatientMetricsCard analytics={systemAnalytics} />
                </Grid>

                {/* Blockchain Metrics */}
                <Grid item xs={12} md={4}>
                    <BlockchainMetricsCard analytics={systemAnalytics?.blockchainMetrics} />
                </Grid>

                {/* Transaction History Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Transaction History
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={transactionHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="transactions"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="gasUsed"
                                    stroke="#82ca9d"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsDashboard;
