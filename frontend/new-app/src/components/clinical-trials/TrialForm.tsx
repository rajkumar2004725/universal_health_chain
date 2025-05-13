import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface TrialFormProps {
    trialId?: string;
    onSubmit?: () => void;
}

interface ClinicalTrial {
    title: string;
    description: string;
    status: 'recruiting' | 'active' | 'completed' | 'suspended';
    startDate: string;
    endDate: string;
    targetParticipants: number;
    eligibilityCriteria: string[];
    sponsorName: string;
    principalInvestigator: string;
    location: string;
}

const TrialForm: React.FC<TrialFormProps> = ({ trialId, onSubmit }) => {
    const [loading, setLoading] = useState(false);
    const [trial, setTrial] = useState<ClinicalTrial>({
        title: '',
        description: '',
        status: 'recruiting',
        startDate: '',
        endDate: '',
        targetParticipants: 0,
        eligibilityCriteria: [],
        sponsorName: '',
        principalInvestigator: '',
        location: '',
    });
    const [newCriteria, setNewCriteria] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (trialId) {
                await api.put(`/clinical-trials/${trialId}`, trial);
                enqueueSnackbar('Clinical trial updated successfully', { variant: 'success' });
            } else {
                await api.post('/clinical-trials', trial);
                enqueueSnackbar('Clinical trial created successfully', { variant: 'success' });
            }
            onSubmit?.();
        } catch (error) {
            console.error('Error saving clinical trial:', error);
            enqueueSnackbar('Error saving clinical trial', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
        const { name, value } = e.target;
        setTrial((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddCriteria = () => {
        if (newCriteria.trim()) {
            setTrial((prev) => ({
                ...prev,
                eligibilityCriteria: [...prev.eligibilityCriteria, newCriteria.trim()],
            }));
            setNewCriteria('');
        }
    };

    const handleRemoveCriteria = (index: number) => {
        setTrial((prev) => ({
            ...prev,
            eligibilityCriteria: prev.eligibilityCriteria.filter((_, i) => i !== index),
        }));
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                {trialId ? 'Edit Clinical Trial' : 'Create Clinical Trial'}
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Title"
                            name="title"
                            value={trial.title}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Description"
                            name="description"
                            value={trial.description}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={trial.status}
                                onChange={handleChange}
                                label="Status"
                            >
                                <MenuItem value="recruiting">Recruiting</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="suspended">Suspended</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Target Participants"
                            name="targetParticipants"
                            value={trial.targetParticipants}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Start Date"
                            name="startDate"
                            value={trial.startDate}
                            onChange={handleChange}
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="date"
                            label="End Date"
                            name="endDate"
                            value={trial.endDate}
                            onChange={handleChange}
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Sponsor Name"
                            name="sponsorName"
                            value={trial.sponsorName}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Principal Investigator"
                            name="principalInvestigator"
                            value={trial.principalInvestigator}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Location"
                            name="location"
                            value={trial.location}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Eligibility Criteria
                        </Typography>
                        <Box display="flex" gap={2} mb={2}>
                            <TextField
                                fullWidth
                                label="Add Criteria"
                                value={newCriteria}
                                onChange={(e) => setNewCriteria(e.target.value)}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddCriteria}
                                disabled={!newCriteria.trim()}
                            >
                                Add
                            </Button>
                        </Box>
                        <Box display="flex" gap={1} flexWrap="wrap">
                            {trial.eligibilityCriteria.map((criteria, index) => (
                                <Chip
                                    key={index}
                                    label={criteria}
                                    onDelete={() => handleRemoveCriteria(index)}
                                />
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button
                                type="button"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                            >
                                {trialId ? 'Update Trial' : 'Create Trial'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default TrialForm;
