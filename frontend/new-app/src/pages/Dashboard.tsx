import React from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    Container,
} from '@mui/material';
import {
    LocalHospital,
    Science,
    People,
    Assignment,
    TrendingUp,
    Vaccines,
} from '@mui/icons-material';
import { SnackbarProvider } from 'notistack';
import { RootState } from '../store';

// Analytics Components
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import BlockchainMetricsCard from '../components/analytics/BlockchainMetricsCard';

// Blockchain Components
import WalletInfo from '../components/blockchain/WalletInfo';
import SecureFileUpload from '../components/blockchain/SecureFileUpload';
import TransactionHistory from '../components/blockchain/TransactionHistory';

const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                    sx={{
                        backgroundColor: `${color}20`,
                        borderRadius: '50%',
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {React.cloneElement(icon as React.ReactElement, {
                        style: { color },
                    })}
                </Box>
                <Typography variant="h6" component="div">
                    {title}
                </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
);

const ActionCard: React.FC<{
    title: string;
    description: string;
    action: string;
    onClick: () => void;
}> = ({ title, description, action, onClick }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {description}
            </Typography>
        </CardContent>
        <CardActions>
            <Button size="small" onClick={onClick}>
                {action}
            </Button>
        </CardActions>
    </Card>
);

const Dashboard: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);

    // Mock data - In real app, fetch from API
    const stats = {
        totalPatients: 1250,
        activeTrials: 8,
        pendingRecords: 15,
        totalProviders: 45,
        completedTrials: 12,
        vaccinations: 850,
    };

    const renderPatientDashboard = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h4" gutterBottom>
                    Welcome back, {user?.profile?.firstName || user?.username || 'User'}!
                </Typography>
                <Chip
                    label="Patient Dashboard"
                    color="primary"
                    sx={{ mb: 3 }}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Health Records"
                    value={stats.pendingRecords}
                    icon={<Assignment />}
                    color="#2196f3"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Active Trials"
                    value={stats.activeTrials}
                    icon={<Science />}
                    color="#4caf50"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Vaccinations"
                    value={stats.vaccinations}
                    icon={<Vaccines />}
                    color="#ff9800"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <ActionCard
                    title="Update Health Profile"
                    description="Keep your health information up to date for better care."
                    action="Update Profile"
                    onClick={() => {}}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <ActionCard
                    title="Join Clinical Trial"
                    description="Participate in groundbreaking medical research."
                    action="View Trials"
                    onClick={() => {}}
                />
            </Grid>
        </Grid>
    );

    const renderDoctorDashboard = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h4" gutterBottom>
                Welcome, Dr. {user?.profile?.firstName || user?.username || 'User'}!
                </Typography>
                <Chip
                    label="Healthcare Provider Dashboard"
                    color="primary"
                    sx={{ mb: 3 }}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon={<People />}
                    color="#2196f3"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Pending Records"
                    value={stats.pendingRecords}
                    icon={<Assignment />}
                    color="#f44336"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Active Trials"
                    value={stats.activeTrials}
                    icon={<Science />}
                    color="#4caf50"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <ActionCard
                    title="Patient Appointments"
                    description="View and manage your upcoming appointments."
                    action="View Schedule"
                    onClick={() => {}}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <ActionCard
                    title="Clinical Trial Management"
                    description="Manage your clinical trials and patient participation."
                    action="Manage Trials"
                    onClick={() => {}}
                />
            </Grid>
        </Grid>
    );

    const renderAdminDashboard = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h4" gutterBottom>
                    System Overview
                </Typography>
                <Chip
                    label="Administrator Dashboard"
                    color="primary"
                    sx={{ mb: 3 }}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon={<People />}
                    color="#2196f3"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Healthcare Providers"
                    value={stats.totalProviders}
                    icon={<LocalHospital />}
                    color="#4caf50"
                />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <StatCard
                    title="Clinical Trials"
                    value={stats.completedTrials}
                    icon={<TrendingUp />}
                    color="#ff9800"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <ActionCard
                    title="System Analytics"
                    description="View detailed system analytics and statistics."
                    action="View Analytics"
                    onClick={() => {}}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <ActionCard
                    title="User Management"
                    description="Manage system users and their permissions."
                    action="Manage Users"
                    onClick={() => {}}
                />
            </Grid>
        </Grid>
    );

    const renderDashboardByRole = () => {
        switch (user?.role) {
            case 'PATIENT':
                return renderPatientDashboard();
            case 'DOCTOR':
            case 'HEALTHCARE_PROVIDER':
                return renderDoctorDashboard();
            case 'ADMIN':
                return renderAdminDashboard();
            default:
                return <Typography>Invalid role</Typography>;
        }
    };

    return (
        <SnackbarProvider maxSnack={3}>
            <Box sx={{ p: 3 }}>
                {/* Role-based dashboard content */}
                <Paper sx={{ p: 3, mb: 3 }}>{renderDashboardByRole()}</Paper>

                {/* Blockchain and Analytics Section */}
                <Container maxWidth="xl">
                    <Grid container spacing={3}>
                        {/* Wallet and File Upload Section */}
                        <Grid item xs={12} md={4}>
                            <WalletInfo />
                            <Box mt={3}>
                                <SecureFileUpload />
                            </Box>
                        </Grid>

                        {/* Analytics Section */}
                        <Grid item xs={12} md={8}>
                            <AnalyticsDashboard />
                        </Grid>

                        {/* Transaction History */}
                        <Grid item xs={12}>
                            <TransactionHistory />
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </SnackbarProvider>
    );
};

export default Dashboard;