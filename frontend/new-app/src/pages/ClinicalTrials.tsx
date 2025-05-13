import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stepper,
    Step,
    StepLabel,
    TextField,
    FormControlLabel,
    Checkbox,
    Divider,
    Chip,
    LinearProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Science,
    People,
    Assignment,
    CalendarToday,
    LocationOn,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { PageHeader, LoadingSpinner, ConfirmationDialog, StatusBadge } from '../components/common';
import { RootState } from '../store';

interface ClinicalTrial {
    id: string;
    title: string;
    description: string;
    status: 'recruiting' | 'active' | 'completed' | 'cancelled';
    startDate: string;
    endDate: string;
    location: string;
    participants: {
        current: number;
        required: number;
    };
    eligibilityCriteria: string[];
    compensation: string;
    sponsoredBy: string;
    phase: number;
    conditions: string[];
}

const ClinicalTrials: React.FC = () => {
    const [trials, setTrials] = useState<ClinicalTrial[]>([
        {
            id: '1',
            title: 'Novel Treatment for Type 2 Diabetes',
            description: 'A phase 3 clinical trial testing a new oral medication for type 2 diabetes management.',
            status: 'recruiting',
            startDate: '2025-06-01',
            endDate: '2026-06-01',
            location: 'City General Hospital',
            participants: {
                current: 75,
                required: 200
            },
            eligibilityCriteria: [
                'Age 18-65',
                'Diagnosed with Type 2 Diabetes',
                'Not currently on insulin therapy',
                'HbA1c between 7.0% and 10.0%'
            ],
            compensation: '$500 per visit',
            sponsoredBy: 'PharmaCorp International',
            phase: 3,
            conditions: ['Type 2 Diabetes', 'Metabolic Disorders']
        },
        {
            id: '2',
            title: 'Advanced Heart Disease Prevention Study',
            description: 'Investigating a new preventive approach for individuals at high risk of cardiovascular disease.',
            status: 'active',
            startDate: '2025-04-01',
            endDate: '2026-10-01',
            location: 'Cardiac Research Center',
            participants: {
                current: 150,
                required: 300
            },
            eligibilityCriteria: [
                'Age 40-75',
                'High blood pressure',
                'High cholesterol',
                'No previous heart attacks'
            ],
            compensation: '$750 per visit',
            sponsoredBy: 'CardioHealth Research',
            phase: 2,
            conditions: ['Cardiovascular Disease', 'Hypertension']
        }
    ]);

    const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isParticipateOpen, setIsParticipateOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

    const { user } = useSelector((state: RootState) => state.auth);

    const participationSteps = [
        'Review Eligibility',
        'Personal Information',
        'Medical History',
        'Consent Forms'
    ];

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleParticipate = (trial: ClinicalTrial) => {
        setSelectedTrial(trial);
        setIsParticipateOpen(true);
        setActiveStep(0);
    };

    const handleViewDetails = (trial: ClinicalTrial) => {
        setSelectedTrial(trial);
        setIsDetailsOpen(true);
    };

    const getStatusColor = (status: ClinicalTrial['status']) => {
        switch (status) {
            case 'recruiting':
                return 'success';
            case 'active':
                return 'primary';
            case 'completed':
                return 'default';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const renderParticipationStep = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Eligibility Criteria</Typography>
                        {selectedTrial?.eligibilityCriteria.map((criteria, index) => (
                            <FormControlLabel
                                key={index}
                                control={<Checkbox />}
                                label={criteria}
                            />
                        ))}
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Personal Information</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Emergency Contact"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    multiline
                                    rows={3}
                                    required
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Medical History</Typography>
                        <TextField
                            fullWidth
                            label="Current Medications"
                            multiline
                            rows={2}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Previous Conditions"
                            multiline
                            rows={2}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Allergies"
                            margin="normal"
                        />
                    </Box>
                );
            case 3:
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Consent Forms</Typography>
                        <Typography paragraph>
                            Please review and accept the following consent forms:
                        </Typography>
                        <FormControlLabel
                            control={<Checkbox required />}
                            label="I have read and agree to the terms of participation"
                        />
                        <FormControlLabel
                            control={<Checkbox required />}
                            label="I understand the risks and benefits of participation"
                        />
                        <FormControlLabel
                            control={<Checkbox required />}
                            label="I agree to share my medical information for this trial"
                        />
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader 
                title="Clinical Trials"
                breadcrumbs={[
                    { text: 'Dashboard', href: '/dashboard' },
                    { text: 'Clinical Trials' }
                ]}
            />

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <Grid container spacing={3}>
                    {trials.map((trial) => (
                        <Grid item xs={12} md={6} key={trial.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" component="div">
                                            {trial.title}
                                        </Typography>
                                        <Chip
                                            label={trial.status.toUpperCase()}
                                            color={getStatusColor(trial.status)}
                                            size="small"
                                        />
                                    </Box>
                                    <Typography color="text.secondary" gutterBottom>
                                        Phase {trial.phase} Trial
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        {trial.description}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarToday fontSize="small" />
                                                <Typography variant="body2">
                                                    {new Date(trial.startDate).toLocaleDateString()} - {new Date(trial.endDate).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LocationOn fontSize="small" />
                                                <Typography variant="body2">
                                                    {trial.location}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(trial.participants.current / trial.participants.required) * 100}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                            {trial.participants.current} of {trial.participants.required} participants
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <Divider />
                                <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                                    <Button
                                        size="small"
                                        onClick={() => handleViewDetails(trial)}
                                        startIcon={<InfoIcon />}
                                    >
                                        View Details
                                    </Button>
                                    {trial.status === 'recruiting' && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => handleParticipate(trial)}
                                            startIcon={<CheckCircleIcon />}
                                        >
                                            Participate
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Trial Details Dialog */}
            <Dialog
                open={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedTrial?.title}
                    <Chip
                        label={selectedTrial?.status.toUpperCase()}
                        color={getStatusColor(selectedTrial?.status || 'completed')}
                        size="small"
                        sx={{ ml: 2 }}
                    />
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>About the Trial</Typography>
                        <Typography paragraph>{selectedTrial?.description}</Typography>

                        <Typography variant="h6" gutterBottom>Trial Information</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Duration</Typography>
                                <Typography gutterBottom>
                                    {selectedTrial?.startDate} to {selectedTrial?.endDate}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Location</Typography>
                                <Typography gutterBottom>{selectedTrial?.location}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Sponsored By</Typography>
                                <Typography gutterBottom>{selectedTrial?.sponsoredBy}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2">Compensation</Typography>
                                <Typography gutterBottom>{selectedTrial?.compensation}</Typography>
                            </Grid>
                        </Grid>

                        <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Eligibility Criteria</Typography>
                        <Box sx={{ pl: 2 }}>
                            {selectedTrial?.eligibilityCriteria.map((criteria, index) => (
                                <Typography key={index} component="li">{criteria}</Typography>
                            ))}
                        </Box>

                        <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Conditions</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {selectedTrial?.conditions.map((condition, index) => (
                                <Chip key={index} label={condition} />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    {selectedTrial?.status === 'recruiting' && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setIsDetailsOpen(false);
                                handleParticipate(selectedTrial);
                            }}
                        >
                            Participate
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Participation Dialog */}
            <Dialog
                open={isParticipateOpen}
                onClose={() => setIsParticipateOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Participate in Trial</DialogTitle>
                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
                        {participationSteps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    {renderParticipationStep()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsParticipateOpen(false)}>Cancel</Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    {activeStep > 0 && (
                        <Button onClick={handleBack}>Back</Button>
                    )}
                    {activeStep === participationSteps.length - 1 ? (
                        <Button variant="contained" onClick={() => setIsParticipateOpen(false)}>
                            Submit Application
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Withdraw Confirmation Dialog */}
            <ConfirmationDialog
                open={isWithdrawDialogOpen}
                title="Withdraw from Trial"
                message="Are you sure you want to withdraw from this clinical trial? This action cannot be undone."
                severity="warning"
                confirmText="Withdraw"
                onConfirm={() => setIsWithdrawDialogOpen(false)}
                onCancel={() => setIsWithdrawDialogOpen(false)}
            />
        </Box>
    );
};

export default ClinicalTrials;
