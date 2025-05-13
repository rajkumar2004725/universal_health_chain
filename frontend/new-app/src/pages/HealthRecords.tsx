import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Typography, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSelector } from 'react-redux';
import { useSnackbar, VariantType } from 'notistack';

import { RootState } from '../store';
import blockchainService from '../services/blockchain.service';
import { apiService } from '../services/api.service';
import HealthRecordForm from '../components/health-records/HealthRecordForm';
import FileViewer from '../components/health-records/FileViewer';

import { HealthRecord } from '../types/health-record';

interface CreateHealthRecordDTO {
    patientId: string;
    recordType: string;
    data: {
        title: string;
        description: string;
        date: string;
        provider: string;
        status: string;
        attachments: string[];
    };
}

interface AddRecordDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (record: Omit<CreateHealthRecordDTO, 'patientId' | 'recordType'>) => void;
    recordTypes: string[];
}

interface ViewRecordDialogProps {
    open: boolean;
    onClose: () => void;
    record: HealthRecord;
}

interface DeleteConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    content: string;
}

const AddRecordDialog: React.FC<AddRecordDialogProps> = ({ open, onClose, onSubmit, recordTypes }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [date, setDate] = useState('');

    const handleSubmit = () => {
        onSubmit({
            data: {
                title,
                description,
                date,
                provider: '',
                status: 'active',
                attachments: []
            }
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add Health Record</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        Title: <input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Description: <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Type: 
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            {recordTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Date: <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">Add</Button>
            </DialogActions>
        </Dialog>
    );
};

const ViewRecordDialog: React.FC<ViewRecordDialogProps> = ({ open, onClose, record }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>View Health Record</DialogTitle>
        <DialogContent>
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>{record.title}</Typography>
                <Typography variant="body1" gutterBottom>Type: {record.recordType}</Typography>
                <Typography variant="body1" gutterBottom>Date: {new Date(record.timestamp).toLocaleDateString()}</Typography>
                <Typography variant="body1" gutterBottom>Description: {record.description}</Typography>
                {record.metadata?.attachments && record.metadata.attachments.length > 0 && (
                    <>
                        <Typography variant="body1" gutterBottom>Attachments:</Typography>
                        <ul>
                            {record.metadata.attachments.map((attachment: string, index: number) => (
                                <li key={index}>{attachment}</li>
                            ))}
                        </ul>
                    </>
                )}
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Close</Button>
        </DialogActions>
    </Dialog>
);

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ open, onClose, onConfirm, title, content }) => (
    <Dialog open={open} onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <Typography>{content}</Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={onConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
    </Dialog>
);

const LoadingSpinner: React.FC = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
    </Box>
);

const PageHeader: React.FC<{ title: string; breadcrumbs: { text: string; link?: string; }[] }> = ({ title, breadcrumbs }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
            {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <Typography>/</Typography>}
                    {item.link ? (
                        <Button variant="text" href={item.link}>{item.text}</Button>
                    ) : (
                        <Typography>{item.text}</Typography>
                    )}
                </React.Fragment>
            ))}
        </Box>
    </Box>
);

const recordTypes = ['Medical', 'Lab Test', 'Prescription', 'Vaccination'];

const HealthRecords: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [records, setRecords] = useState<HealthRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
    const [activeTab, setActiveTab] = useState<number>(0);
    
    const user = useSelector((state: RootState) => state.auth.user);

    const handleViewRecord = useCallback((record: HealthRecord) => {
        setSelectedRecord(record);
        setIsViewDialogOpen(true);
    }, []);

    const handleDeleteRecord = useCallback(async (id: string) => {
        try {
            // Assuming delete method exists in your service
            await blockchainService.deleteHealthRecord(id);
            setRecords(prev => prev.filter(r => r.id !== id));
            setIsDeleteDialogOpen(false);
            enqueueSnackbar('Record deleted successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Failed to delete record', { variant: 'error' });
        }
    }, [enqueueSnackbar]);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            
            // Initialize blockchain service first
            console.log('Initializing blockchain service...');
            try {
                await blockchainService.initialize();
                console.log('Blockchain service initialized successfully');
            } catch (initError) {
                console.warn('Failed to initialize blockchain service:', initError);
                // Continue with API-only fetch if blockchain init fails
            }
            
            // Fetch records from both API and blockchain
            let apiRecords = [];
            let blockchainRecords = [];
            
            try {
                const apiResponse = await apiService.getHealthRecords();
                apiRecords = apiResponse.data || [];
                console.log('API records fetched:', apiRecords.length);
            } catch (apiError) {
                console.error('Error fetching API records:', apiError);
            }
            
            try {
                blockchainRecords = await blockchainService.getHealthRecords() || [];
                console.log('Blockchain records fetched:', blockchainRecords.length);
            } catch (blockchainError) {
                console.error('Error fetching blockchain records:', blockchainError);
            }
            
            // Merge records from API and blockchain
            const allRecords = [...apiRecords, ...blockchainRecords];
            console.log('Total records:', allRecords.length);
            
            // Remove duplicates based on record ID
            const uniqueRecords = Array.from(new Map(allRecords.map(record => [record.id, record])).values());
            setRecords(uniqueRecords);
        } catch (error) {
            console.error('Error fetching records:', error);
            setError('Failed to fetch health records');
            enqueueSnackbar('Failed to fetch health records', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleAddRecord = useCallback(async (record: Omit<CreateHealthRecordDTO, 'patientId' | 'recordType'>) => {
        try {
            // Implement your add record logic here
            // const newRecord = await apiService.createHealthRecord(record);
            // setRecords(prev => [...prev, newRecord]);
            enqueueSnackbar('Record added successfully', { variant: 'success' });
            setIsAddDialogOpen(false);
            fetchRecords(); // Refresh the list
        } catch (error) {
            enqueueSnackbar(error instanceof Error ? error.message : 'Failed to add record', { variant: 'error' });
        }
    }, [enqueueSnackbar, fetchRecords]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Health Records"
                breadcrumbs={[
                    { text: 'Home', link: '/' },
                    { text: 'Health Records' }
                ]}
            />

            {error ? (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : null}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">My Health Information</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setIsAddDialogOpen(true)}
                    startIcon={<AddIcon />}
                >
                    Add Record
                </Button>
            </Box>
            
            <Paper sx={{ mb: 3 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Health Records" />
                    <Tab label="Files & Sharing" />
                </Tabs>
            </Paper>

            {activeTab === 0 ? (
                records.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            No health records found
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setIsAddDialogOpen(true)}
                            sx={{ mt: 2 }}
                        >
                            Add Your First Record
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {records.map((record) => (
                            <Grid item xs={12} key={record.id}>
                                <Card>
                                    <CardContent>
                                        <HealthRecordForm
                                            recordId={record.id}
                                            onSubmit={() => fetchRecords()}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )
            ) : (
                <FileViewer />
            )}

            <AddRecordDialog
                open={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSubmit={handleAddRecord}
                recordTypes={recordTypes}
            />

            {selectedRecord && (
                <>
                    <ViewRecordDialog
                        open={isViewDialogOpen}
                        onClose={() => setIsViewDialogOpen(false)}
                        record={selectedRecord}
                    />

                    <DeleteConfirmDialog
                        open={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={() => selectedRecord && handleDeleteRecord(selectedRecord.id)}
                        title="Delete Health Record"
                        content="Are you sure you want to delete this health record? This action cannot be undone."
                    />
                </>
            )}
        </Box>
    );
};

export default HealthRecords;