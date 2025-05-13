import React from 'react';
import { Paper, Typography, Box, CircularProgress, LinearProgress } from '@mui/material';
import { HealthSystemAnalytics } from '../../services/analytics.service';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
    analytics: HealthSystemAnalytics | null;
}

const PatientMetricsCard: React.FC<Props> = ({ analytics }) => {
    if (!analytics || !analytics.patientMetrics || !analytics.recordMetrics) {
        return (
            <Paper sx={{ p: 2, height: '100%' }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    const { patientMetrics, recordMetrics } = analytics;

    // Check if recordTypes exists and has data
    const recordTypes = recordMetrics.recordTypes || {};
    const recordTypeEntries = Object.entries(recordTypes);

    const chartData = {
        labels: recordTypeEntries.map(([type]) => type),
        datasets: [
            {
                label: 'Record Distribution',
                data: recordTypeEntries.map(([, count]) => count),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const activeRate = patientMetrics.totalPatients > 0
        ? (patientMetrics.activePatients / patientMetrics.totalPatients) * 100
        : 0;

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Patient Metrics
            </Typography>

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Total Patients
                </Typography>
                <Typography variant="h4">{patientMetrics.totalPatients || 0}</Typography>
            </Box>

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Active Patients Rate
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                    <Box flexGrow={1} mr={1}>
                        <LinearProgress
                            variant="determinate"
                            value={activeRate}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                            }}
                        />
                    </Box>
                    <Typography variant="body2">{activeRate.toFixed(1)}%</Typography>
                </Box>
            </Box>

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    New Patients (Last 30 days)
                </Typography>
                <Typography variant="h5">{patientMetrics.newPatients || 0}</Typography>
            </Box>

            {recordTypeEntries.length > 0 && (
                <Box mt={2} height={200}>
                    <Bar
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false,
                                },
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                },
                            },
                        }}
                    />
                </Box>
            )}

            <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                    Demographics
                </Typography>
                <Box mt={1}>
                    {Object.entries(patientMetrics.demographicDistribution || {}).map(([demo, count]) => (
                        <Box key={demo} display="flex" justifyContent="space-between" mt={0.5}>
                            <Typography variant="body2">{demo}</Typography>
                            <Typography variant="body2">{count}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Paper>
    );
};

export default PatientMetricsCard;
