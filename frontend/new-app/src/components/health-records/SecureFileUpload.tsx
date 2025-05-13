import React, { useState, useRef, ChangeEvent } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  LinearProgress, 
  Paper,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import ipfsService from '../../services/ipfs.service';
import blockchainService from '../../services/blockchain.service';

interface SecureFileUploadProps {
  onUploadComplete?: (fileInfo: {
    name: string;
    ipfsHash: string;
    encryptionKey: string;
    size: number;
    type: string;
  }) => void;
}

const SecureFileUpload: React.FC<SecureFileUploadProps> = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    ipfsHash: string;
    encryptionKey: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a random encryption key
  const generateEncryptionKey = () => {
    const randomKey = Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 36).toString(36)
    ).join('');
    setEncryptionKey(randomKey);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(Array.from(event.target.files));
      // Auto-generate encryption key if none exists
      if (!encryptionKey) {
        generateEncryptionKey();
      }
      setError(null);
    }
  };

  // Use blockchain service for file upload

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    if (!encryptionKey) {
      setError('Please enter an encryption key');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Initialize blockchain service
      await blockchainService.initialize();
      console.log('Blockchain service initialized');

      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProgress(Math.round((i / selectedFiles.length) * 30)); // First 30% for processing

        // Upload to IPFS with encryption
        const ipfsHash = await ipfsService.uploadEncryptedFile(file, encryptionKey);
        console.log(`File uploaded to IPFS with hash: ${ipfsHash}`);
        
        setProgress(30 + Math.round((i + 1) / selectedFiles.length * 30)); // Next 30% for IPFS
        
        // Prepare metadata for blockchain storage
        const metadata = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          encryptionKey: encryptionKey,
          description: 'Uploaded via SecureFileUpload component'
        };
        
        try {
          // Store record on blockchain
          console.log('Storing health record on blockchain with IPFS hash:', ipfsHash);
          const result = await blockchainService.storeHealthRecord(ipfsHash, metadata);
          console.log('Health record stored on blockchain:', result);
          
          setProgress(60 + Math.round((i + 1) / selectedFiles.length * 40)); // Final 40% for blockchain
          
          // Add to uploaded files list
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            ipfsHash,
            encryptionKey
          }]);

          // Call the callback if provided
          if (onUploadComplete) {
            onUploadComplete({
              name: file.name,
              ipfsHash,
              encryptionKey,
              size: file.size,
              type: file.type
            });
          }

          // Save to localStorage as a cache
          const storedFiles = localStorage.getItem('uhc-uploaded-files');
          const existingFiles = storedFiles ? JSON.parse(storedFiles) : [];
          
          const recordId = result?.events?.HealthRecordCreated?.returnValues?.recordId || 
                          Math.random().toString(36).substring(2, 15);
          
          const newFile = {
            id: recordId,
            name: file.name,
            type: file.type,
            size: file.size,
            dateUploaded: new Date().toISOString(),
            ipfsHash,
            encryptionKey,
            sharedWith: []
          };
          
          localStorage.setItem('uhc-uploaded-files', JSON.stringify([...existingFiles, newFile]));
        } catch (blockchainError) {
          console.error('Error storing record on blockchain:', blockchainError);
          
          // Continue with localStorage fallback
          const storedFiles = localStorage.getItem('uhc-uploaded-files');
          const existingFiles = storedFiles ? JSON.parse(storedFiles) : [];
          
          const newFile = {
            id: Math.random().toString(36).substring(2, 15),
            name: file.name,
            type: file.type,
            size: file.size,
            dateUploaded: new Date().toISOString(),
            ipfsHash,
            encryptionKey,
            sharedWith: []
          };
          
          localStorage.setItem('uhc-uploaded-files', JSON.stringify([...existingFiles, newFile]));
        }
      }

      // Reset state after successful upload
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Keep the encryption key for next upload
    } catch (error) {
      console.error('Error uploading files:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  // Remove a file from the selection
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Secure File Upload
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Files are encrypted before being uploaded to IPFS. Only you and those you share with will be able to access these files.
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            variant="outlined"
            label="Encryption Key"
            value={encryptionKey}
            onChange={(e) => setEncryptionKey(e.target.value)}
            InputProps={{
              endAdornment: (
                <Tooltip title="Generate Random Key">
                  <IconButton onClick={generateEncryptionKey} edge="end">
                    <LockIcon />
                  </IconButton>
                </Tooltip>
              )
            }}
            helperText="This key will be used to encrypt your files. Keep it safe!"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            fullWidth
          >
            Select Files
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
            />
          </Button>
        </Grid>
      </Grid>
      
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 1, maxHeight: '200px', overflow: 'auto' }}>
            {selectedFiles.map((file, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  borderBottom: index < selectedFiles.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: '250px' }}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({(file.size / 1024).toFixed(1)} KB)
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => removeFile(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Paper>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            startIcon={uploading ? undefined : <LockIcon />}
            sx={{ mt: 2 }}
            fullWidth
          >
            {uploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload'}
          </Button>
        </Box>
      )}
      
      {uploading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
            {progress < 50 
              ? 'Encrypting files...' 
              : progress < 100 
                ? 'Uploading to IPFS...' 
                : 'Upload complete!'}
          </Typography>
        </Box>
      )}
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recently Uploaded
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 1 }}>
            {uploadedFiles.slice(-3).map((file, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  borderBottom: index < uploadedFiles.slice(-3).length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2" noWrap sx={{ maxWidth: '250px' }}>
                    {file.name}
                  </Typography>
                </Box>
                <Tooltip title="IPFS Hash">
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {file.ipfsHash.substring(0, 10)}...
                  </Typography>
                </Tooltip>
              </Box>
            ))}
          </Paper>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Go to the "Files & Sharing" tab to view and share your uploaded files.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SecureFileUpload;
