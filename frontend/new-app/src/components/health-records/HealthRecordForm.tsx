import React, { useState, ChangeEvent } from 'react';
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
    SelectChangeEvent,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import SecureFileUpload from '../blockchain/SecureFileUpload';

interface HealthRecordFormProps {
    recordId?: string;
    onSubmit?: () => void;
}

interface HealthRecord {
    id?: string;
    title: string;
    type: string;
    description: string;
    date: string;
    attachments: string[];
    status: 'active' | 'archived';
}

interface SecureFileUploadProps {
    onUploadComplete: (fileHash: string) => void;
}

interface FormInputEvent extends ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & {
        name: keyof HealthRecord;
        value: string;
    };
}

type FormSelectEvent = SelectChangeEvent & {
    target: {
        name: keyof HealthRecord;
        value: string;
    };
}

const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ recordId, onSubmit }) => {
    const [loading, setLoading] = useState(false);
    const [record, setRecord] = useState<HealthRecord>({
        title: '',
        type: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        attachments: [],
        status: 'active',
    });
    const { enqueueSnackbar } = useSnackbar();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (recordId) {
                await api.put(`/health-records/${recordId}`, record);
                enqueueSnackbar('Health record updated successfully', { variant: 'success' });
            } else {
                await api.post('/health-records', record);
                enqueueSnackbar('Health record created successfully', { variant: 'success' });
            }
            onSubmit?.();
        } catch (error) {
            console.error('Error saving health record:', error);
            enqueueSnackbar('Error saving health record', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRecord((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setRecord((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (fileHash: string) => {
        setRecord((prev) => ({
            ...prev,
            attachments: [...prev.attachments, fileHash],
        }));
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                {recordId ? 'Edit Health Record' : 'Create Health Record'}
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Title"
                            name="title"
                            value={record.title}
                            onChange={handleInputChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Type</InputLabel>
                            <Select
                                name="type"
                                value={record.type}
                                onChange={handleSelectChange}
                                label="Type"
                            >
                                <MenuItem value="consultation">Consultation</MenuItem>
                                <MenuItem value="lab_result">Lab Result</MenuItem>
                                <MenuItem value="prescription">Prescription</MenuItem>
                                <MenuItem value="imaging">Imaging</MenuItem>
                                <MenuItem value="vaccination">Vaccination</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Description"
                            name="description"
                            value={record.description}
                            onChange={handleInputChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Date"
                            name="date"
                            value={record.date}
                            onChange={handleInputChange}
                            required
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={record.status}
                                onChange={handleSelectChange}
                                label="Status"
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="archived">Archived</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Attachments
                        </Typography>
                        <SecureFileUpload onUploadComplete={handleFileUpload} />
                        {record.attachments.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Uploaded Files:
                                </Typography>
                                {record.attachments.map((hash, index) => (
                                    <Box key={hash} mb={1}>
                                        File {index + 1}: {hash}
                                    </Box>
                                ))}
                            </Box>
                        )}
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
                                {recordId ? 'Update Record' : 'Create Record'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default HealthRecordForm;
