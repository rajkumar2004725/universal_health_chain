import React, { useState, useCallback } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import ipfsService from '../../services/ipfs.service';
import privacyService from '../../services/privacy.service';

interface SecureFileUploadProps {
    onUploadComplete?: (fileHash: string) => void;
}

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    ipfsHash: string;
    encryptionKey?: string;
}

const SecureFileUpload: React.FC<SecureFileUploadProps> = ({ onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const { enqueueSnackbar } = useSnackbar();

    const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;

        setUploading(true);
        try {
            const newFiles: UploadedFile[] = [];

            for (const file of Array.from(event.target.files)) {
                // Generate encryption key
                const encryptionKey = await privacyService.generateSharingKey();

                // Upload encrypted file to IPFS
                const ipfsHash = await ipfsService.uploadEncryptedFile(file, encryptionKey);

                newFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    ipfsHash,
                    encryptionKey,
                });
            }

            setFiles((prev) => [...prev, ...newFiles]);
            // Notify parent component of uploaded files
            newFiles.forEach(file => onUploadComplete?.(file.ipfsHash));
            enqueueSnackbar('Files uploaded successfully', { variant: 'success' });
        } catch (error) {
            console.error('Error uploading files:', error);
            enqueueSnackbar('Error uploading files', { variant: 'error' });
        } finally {
            setUploading(false);
        }
    }, [enqueueSnackbar]);

    const handleCopyHash = useCallback((hash: string) => {
        navigator.clipboard.writeText(hash);
        enqueueSnackbar('IPFS hash copied to clipboard', { variant: 'success' });
    }, [enqueueSnackbar]);

    const handleDelete = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        enqueueSnackbar('File removed', { variant: 'info' });
    }, [enqueueSnackbar]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <Card>
            <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Typography variant="h6" gutterBottom>
                        Secure File Upload
                    </Typography>

                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 3,
                            textAlign: 'center',
                            bgcolor: 'background.default',
                        }}
                    >
                        <input
                            type="file"
                            multiple
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                            id="file-upload"
                            disabled={uploading}
                        />
                        <label htmlFor="file-upload">
                            <Button
                                component="span"
                                variant="contained"
                                startIcon={<CloudUploadIcon />}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload Files'}
                            </Button>
                        </label>
                        {uploading && (
                            <Box mt={2} display="flex" justifyContent="center">
                                <CircularProgress size={24} />
                            </Box>
                        )}
                    </Box>

                    {files.length > 0 && (
                        <List>
                            {files.map((file, index) => (
                                <ListItem
                                    key={`${file.ipfsHash}-${index}`}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleDelete(index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemIcon>
                                        <InsertDriveFileIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={file.name}
                                        secondary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="body2" component="span">
                                                    {formatFileSize(file.size)}
                                                </Typography>
                                                <Tooltip title="Copy IPFS Hash">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopyHash(file.ipfsHash)}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default SecureFileUpload;
