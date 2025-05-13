import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box } from '@mui/material';
import { HealthRecord } from '../../types/health-record';

interface HealthRecordCardProps {
    record: HealthRecord;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const HealthRecordCard: React.FC<HealthRecordCardProps> = ({ record, onView, onEdit, onDelete }) => {
    return (
        <Card sx={{ minWidth: 275, mb: 2 }}>
            <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                    {record.title || 'Health Record'}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                    ID: {record.id}
                </Typography>
                <Typography variant="body2">
                    Date: {new Date(record.timestamp).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Type: {record.recordType}
                </Typography>
                {record.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {record.description}
                    </Typography>
                )}
            </CardContent>
            <CardActions>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {onView && (
                        <Button size="small" onClick={() => onView(record.id)}>
                            View
                        </Button>
                    )}
                    {onEdit && (
                        <Button size="small" onClick={() => onEdit(record.id)}>
                            Edit
                        </Button>
                    )}
                    {onDelete && (
                        <Button size="small" color="error" onClick={() => onDelete(record.id)}>
                            Delete
                        </Button>
                    )}
                </Box>
            </CardActions>
        </Card>
    );
};

export default HealthRecordCard;
