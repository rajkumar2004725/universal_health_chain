import React from 'react';
import { Paper, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Legend);

interface BlockchainMetrics {
    totalTransactions: number;
    averageResponseTime: number;
    consensusParticipation: number;
}

interface Props {
    analytics: BlockchainMetrics | undefined;
}

const BlockchainMetricsCard: React.FC<Props> = ({ analytics }) => {
    if (!analytics) {
        return (
            <Paper sx={{ p: 2, height: '100%' }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    // Sample data for the response time chart
    const responseTimeData = {
        labels: ['1h', '2h', '3h', '4h', '5h', '6h'],
        datasets: [
            {
                label: 'Response Time (ms)',
                data: [
                    analytics.averageResponseTime - 50,
                    analytics.averageResponseTime - 30,
                    analytics.averageResponseTime - 10,
                    analytics.averageResponseTime,
                    analytics.averageResponseTime + 10,
                    analytics.averageResponseTime - 20,
                ],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false,
            },
        ],
    };

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Blockchain Metrics
            </Typography>

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Total Transactions
                </Typography>
                <Typography variant="h4">{analytics.totalTransactions.toLocaleString()}</Typography>
            </Box>

            <Box mt={2}>
                <Tooltip title="Average time for transaction confirmation">
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Average Response Time
                        </Typography>
                        <Typography variant="h5">
                            {analytics.averageResponseTime.toFixed(2)} ms
                        </Typography>
                    </Box>
                </Tooltip>
            </Box>

            <Box mt={2}>
                <Tooltip title="Percentage of active nodes participating in consensus">
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Consensus Participation
                        </Typography>
                        <Typography variant="h5">
                            {analytics.consensusParticipation.toFixed(1)}%
                        </Typography>
                    </Box>
                </Tooltip>
            </Box>

            <Box mt={2} height={200}>
                <Line
                    data={responseTimeData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false,
                            },
                            title: {
                                display: true,
                                text: 'Response Time Trend',
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                title: {
                                    display: true,
                                    text: 'ms',
                                },
                            },
                        },
                    }}
                />
            </Box>

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Network Health
                </Typography>
                <Box
                    mt={1}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'background.default',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${analytics.consensusParticipation}%`,
                            bgcolor: analytics.consensusParticipation > 80 ? 'success.main' : 'warning.main',
                            transition: 'width 0.5s ease-in-out',
                        }}
                    />
                </Box>
            </Box>
        </Paper>
    );
};

export default BlockchainMetricsCard;
