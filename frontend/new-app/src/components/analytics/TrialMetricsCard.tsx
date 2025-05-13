import React from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { TrialAnalytics } from '../../services/analytics.service';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
    analytics: TrialAnalytics | null;
}

const TrialMetricsCard: React.FC<Props> = ({ analytics }) => {
    if (!analytics) {
        return (
            <Paper sx={{ p: 2, height: '100%' }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    const chartData = {
        labels: ['Enrollment Rate', 'Completion Rate', 'Adverse Events'],
        datasets: [
            {
                data: [
                    analytics.enrollmentRate,
                    analytics.completionRate,
                    analytics.adverseEvents,
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Clinical Trial Metrics
            </Typography>

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Data Quality Score
                </Typography>
                <Typography variant="h4">
                    {analytics.dataQualityScore.toFixed(1)}%
                </Typography>
            </Box>

            <Box mt={2} height={200}>
                <Doughnut
                    data={chartData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                    }}
                />
            </Box>

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Demographics Distribution
                </Typography>
                <Box mt={1}>
                    {Object.entries(analytics.demographics.ageDistribution).map(([age, count]) => (
                        <Box key={age} display="flex" justifyContent="space-between" mt={0.5}>
                            <Typography variant="body2">{age}</Typography>
                            <Typography variant="body2">{count}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Paper>
    );
};

export default TrialMetricsCard;
