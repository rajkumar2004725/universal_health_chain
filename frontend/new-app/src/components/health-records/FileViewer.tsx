import React, { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import { 
  CloudDownload as DownloadIcon, 
  Share as ShareIcon, 
  Visibility as ViewIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Person as PersonIcon,
  Add as AddIcon
} from '@mui/icons-material';
import blockchainService from '../../services/blockchain.service';
import SecureFileUpload from './SecureFileUpload';
import healthRecordsService from '../../services/health-records.service';

// File storage interface
interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dateUploaded: string;
  ipfsHash: string;
  encryptionKey?: string;
  sharedWith: string[];
  thumbnailUrl?: string;
}

const FileViewer: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [doctors, setDoctors] = useState([
    { id: '1', name: 'Dr. Sarah Johnson', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', specialty: 'Cardiology' },
    { id: '2', name: 'Dr. Michael Chen', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', specialty: 'Neurology' },
    { id: '3', name: 'Dr. Emily Rodriguez', address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', specialty: 'Pediatrics' },
  ]);

  // Use blockchain service for fetching records

  // Load files from blockchain and fallback to localStorage
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        console.log('Fetching health records from blockchain...');
        // Initialize blockchain service if not already initialized
        await blockchainService.initialize();
        
        // Fetch health records from blockchain
        const blockchainRecords = await blockchainService.getHealthRecords();
        console.log('Records fetched from blockchain:', blockchainRecords);
        
        if (blockchainRecords && blockchainRecords.length > 0) {
          // Transform blockchain records to match StoredFile interface
          const transformedFiles: StoredFile[] = blockchainRecords.map((record: any) => ({
            id: record.id || Math.random().toString(36).substring(2, 15),
            name: record.data?.fileName || `${record.recordType || 'Medical'}_Record_${record.id}.pdf`,
            type: record.data?.fileType || 'application/pdf',
            size: record.data?.fileSize || 1024 * 1024, // Default 1MB if unknown
            dateUploaded: record.date || new Date().toISOString(),
            ipfsHash: record.ipfsHash || '',
            encryptionKey: record.data?.encryptionKey || '',
            sharedWith: record.accessList || []
          }));
          
          console.log('Transformed blockchain records:', transformedFiles);
          setFiles(transformedFiles);
          
          // Update localStorage as a cache
          localStorage.setItem('uhc-uploaded-files', JSON.stringify(transformedFiles));
          return;
        } else {
          console.warn('No records found on blockchain, checking localStorage');
        }
      } catch (error) {
        console.error('Error fetching records from blockchain:', error);
      }
      
      // Fallback to localStorage if blockchain fetch fails
      const storedFiles = localStorage.getItem('uhc-uploaded-files');
      if (storedFiles) {
        console.log('Using cached records from localStorage');
        setFiles(JSON.parse(storedFiles));
      } else {
        console.log('No cached records found, using sample data');
        // Add some sample files if none exist
        const sampleFiles: StoredFile[] = [
          {
            id: '1',
            name: 'blood_test_results.pdf',
            type: 'application/pdf',
            size: 1024 * 1024 * 2.3, // 2.3 MB
            dateUploaded: '2025-05-10T14:30:00Z',
            ipfsHash: 'QmT7fQvKRJA98XHVaTC5Lw8RCDFSaesWXdL9GmxJEHjmZD',
            encryptionKey: 'a1b2c3d4e5f6g7h8i9j0',
            sharedWith: []
          },
          {
            id: '2',
            name: 'chest_xray.jpg',
            type: 'image/jpeg',
            size: 1024 * 1024 * 3.7, // 3.7 MB
            dateUploaded: '2025-05-08T09:15:00Z',
            ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
            encryptionKey: 'k1l2m3n4o5p6q7r8s9t0',
            sharedWith: ['0x71C7656EC7ab88b098defB751B7401B5f6d8976F']
          },
          {
            id: '3',
            name: 'prescription.pdf',
            type: 'application/pdf',
            size: 1024 * 512, // 512 KB
            dateUploaded: '2025-05-05T16:45:00Z',
            ipfsHash: 'QmZTR5bcpQD7cFgTorqxZDYaew1Wqgfbd2ud9QqGPAkK2V',
            encryptionKey: 'u1v2w3x4y5z6a7b8c9d0',
            sharedWith: []
          }
        ];
        setFiles(sampleFiles);
        localStorage.setItem('uhc-uploaded-files', JSON.stringify(sampleFiles));
      }
    };
    
    fetchFiles();
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uhc-uploaded-files', JSON.stringify(files));
  }, [files]);

  // Add a new file to storage
  const addFile = useCallback((fileInfo: {
    name: string;
    ipfsHash: string;
    encryptionKey: string;
    size: number;
    type: string;
  }) => {
    const newFile: StoredFile = {
      id: Math.random().toString(36).substring(2, 15),
      name: fileInfo.name,
      type: fileInfo.type,
      size: fileInfo.size,
      dateUploaded: new Date().toISOString(),
      ipfsHash: fileInfo.ipfsHash,
      encryptionKey: fileInfo.encryptionKey,
      sharedWith: []
    };
    
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    localStorage.setItem('uhc-uploaded-files', JSON.stringify(updatedFiles));
  }, [files]);

  // Handle file viewing
  const handleViewFile = (file: StoredFile) => {
    setSelectedFile(file);
    setViewerOpen(true);
  };

  // Handle file sharing
  const handleShareFile = (file: StoredFile) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  // Share file with doctor
  const shareWithDoctor = async () => {
    console.log('Share button clicked');
    if (!selectedFile || !doctorAddress) {
      console.log('Missing required data:', { selectedFile, doctorAddress });
      enqueueSnackbar('Missing file or doctor information', { variant: 'error' });
      return;
    }
    
    try {
      // Ensure we have a valid file ID
      const fileId = selectedFile.id || `file-${Date.now()}`;
      console.log('Attempting to share file:', { fileId, doctorAddress });
      
      // Verify the doctor's address is valid
      const isValidAddress = await blockchainService.verifyAddress(doctorAddress);
      if (!isValidAddress) {
        throw new Error('Invalid blockchain address for doctor');
      }
      
      // Call the blockchain service to grant access
      console.log('Granting access via blockchain...');
      await blockchainService.grantAccess(fileId, doctorAddress);
      console.log('Access granted successfully on blockchain');
      
      // Update the file's sharedWith array locally
      const updatedFiles = files.map(file => {
        if (file.id === selectedFile.id) {
          // Only add the doctor if they're not already in the list
          if (!file.sharedWith.includes(doctorAddress)) {
            return {
              ...file,
              sharedWith: [...file.sharedWith, doctorAddress]
            };
          }
        }
        return file;
      });
      
      setFiles(updatedFiles);
      setShareDialogOpen(false);
      setDoctorAddress('');

      // Show success message
      enqueueSnackbar(`File "${selectedFile.name}" has been shared with the doctor.`, { variant: 'success' });
    } catch (error) {
      console.error('Error sharing file:', error);
      enqueueSnackbar(
        error instanceof Error ? 
          `Error sharing file: ${error.message}` : 
          'Failed to share file with doctor', 
        { variant: 'error' }
      );
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Get doctor name from address
  const getDoctorName = (address: string): string => {
    const doctor = doctors.find(d => d.address === address);
    return doctor ? doctor.name : address.substring(0, 10) + '...';
  };
  
  // Revoke access for a doctor
  const revokeAccess = async (fileId: string, doctorAddress: string) => {
    try {
      // Call the API to revoke access
      await healthRecordsService.revokeAccess(fileId, doctorAddress);
      
      // Update local state
      const updatedFiles = files.map(file => {
        if (file.id === fileId) {
          return {
            ...file,
            sharedWith: file.sharedWith.filter(addr => addr !== doctorAddress)
          };
        }
        return file;
      });
      
      setFiles(updatedFiles);
      
      // Show success message
      enqueueSnackbar('Access revoked successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error revoking access:', error);
      enqueueSnackbar(
        error instanceof Error ? 
          `Error revoking access: ${error.message}` : 
          'Failed to revoke access', 
        { variant: 'error' }
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        My Health Records Files
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        These files are encrypted and stored securely. You can view or share them with healthcare providers.
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="My Files" />
          <Tab label="Upload New Files" />
        </Tabs>
      </Paper>
      
      {activeTab === 1 ? (
        <SecureFileUpload onUploadComplete={addFile} />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {files.map((file) => (
              <Grid item xs={12} sm={6} md={4} key={file.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 3
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      height: 140, 
                      bgcolor: file.type.includes('image') ? 'transparent' : 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {file.type.includes('image') ? (
                      <img 
                        src={file.thumbnailUrl || '/placeholder-image.jpg'} 
                        alt={file.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Typography variant="h3" color="white" sx={{ opacity: 0.7 }}>
                        {file.name.split('.').pop()?.toUpperCase()}
                      </Typography>
                    )}
                    {file.sharedWith.length > 0 && (
                      <Tooltip title={`Shared with ${file.sharedWith.length} doctor(s)`}>
                        <Chip
                          icon={<ShareIcon />}
                          label={file.sharedWith.length}
                          size="small"
                          color="primary"
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(file.size)} • Uploaded on {new Date(file.dateUploaded).toLocaleDateString()}
                    </Typography>
                    
                    {file.sharedWith.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Shared with:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {file.sharedWith.map((address, index) => (
                            <Chip
                              key={index}
                              size="small"
                              icon={<PersonIcon />}
                              label={getDoctorName(address)}
                              variant="outlined"
                              onDelete={() => revokeAccess(file.id, address)}
                              sx={{ maxWidth: '100%' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-around' }}>
                    <Tooltip title="View File">
                      <IconButton onClick={() => handleViewFile(file)} color="primary">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share with Doctor">
                      <IconButton onClick={() => handleShareFile(file)} color="secondary">
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download File">
                      <IconButton color="default">
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* File Viewer Dialog */}
          <Dialog
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {selectedFile?.name}
              <IconButton 
                sx={{ position: 'absolute', right: 8, top: 8 }}
                onClick={() => setViewerOpen(false)}
              >
                <LockIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {selectedFile?.type.includes('image') ? (
                  <img 
                    src={selectedFile.thumbnailUrl || '/placeholder-image.jpg'} 
                    alt={selectedFile.name}
                    style={{ maxWidth: '100%', maxHeight: '50vh' }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <LockIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">
                      Encrypted File
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This file is encrypted and stored on IPFS with hash:
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', mt: 1 }}>
                      {selectedFile?.ipfsHash}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">File Details:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Size: {selectedFile && formatFileSize(selectedFile.size)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Type: {selectedFile?.type}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {selectedFile && new Date(selectedFile.dateUploaded).toLocaleString()}
                    </Typography>
                  </Grid>
                  {selectedFile?.sharedWith.length ? (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Shared with: {selectedFile.sharedWith.map(addr => getDoctorName(addr)).join(', ')}
                      </Typography>
                    </Grid>
                  ) : null}
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewerOpen(false)}>Close</Button>
              <Button 
                variant="contained" 
                startIcon={<ShareIcon />}
                onClick={() => {
                  setViewerOpen(false);
                  if (selectedFile) handleShareFile(selectedFile);
                }}
              >
                Share
              </Button>
            </DialogActions>
          </Dialog>

          {/* Share Dialog */}
          <Dialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Share Health Record</DialogTitle>
            <DialogContent>
              <Typography variant="body2" paragraph>
                Share "{selectedFile?.name}" with a healthcare provider. They will be able to access this encrypted file through the Universal Health Chain.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Select a doctor:
              </Typography>
              
              <List sx={{ mb: 2 }}>
                {doctors.map((doctor) => (
                  <ListItem 
                    key={doctor.id}
                    button
                    selected={doctorAddress === doctor.address}
                    onClick={() => setDoctorAddress(doctor.address)}
                    sx={{ 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        '&:hover': {
                          bgcolor: 'primary.light',
                        }
                      }
                    }}
                  >
                    <ListItemText 
                      primary={doctor.name} 
                      secondary={`${doctor.specialty} • ${doctor.address.substring(0, 10)}...`} 
                    />
                    {selectedFile?.sharedWith.includes(doctor.address) && (
                      <Chip 
                        label="Already shared" 
                        size="small" 
                        color="success" 
                        icon={<UnlockIcon />}
                      />
                    )}
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="subtitle2" gutterBottom>
                Or enter a doctor's blockchain address:
              </Typography>
              <TextField
                fullWidth
                label="Doctor's Blockchain Address"
                variant="outlined"
                value={doctorAddress}
                onChange={(e) => setDoctorAddress(e.target.value)}
                placeholder="0x..."
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="caption" color="text.secondary">
                By sharing this record, you are granting permission for the selected healthcare provider to access this specific health record. You can revoke access at any time.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={shareWithDoctor}
                disabled={!doctorAddress || (selectedFile?.sharedWith.includes(doctorAddress) ?? false)}
              >
                Share Record
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default FileViewer;