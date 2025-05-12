import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import ipfsService from '../services/ipfs.service.js';
import MedicalFile from '../models/MedicalFile.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// Upload medical file
router.post('/upload',
    authenticate,
    authorize('DOCTOR', 'HEALTHCARE_PROVIDER', 'ADMIN'),
    upload.single('file'),
    async (req, res) => {
        try {
            const { patientId, healthRecordId, fileType, metadata } = req.body;

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Upload to IPFS based on file type
            let ipfsResult;
            if (fileType === 'MEDICAL_IMAGE') {
                ipfsResult = await ipfsService.uploadMedicalImage(
                    req.file.buffer,
                    {
                        ...JSON.parse(metadata),
                        fileName: req.file.originalname,
                        fileSize: req.file.size,
                        mimeType: req.file.mimetype
                    }
                );
            } else {
                ipfsResult = await ipfsService.uploadMedicalReport(
                    req.file.buffer,
                    {
                        ...JSON.parse(metadata),
                        fileName: req.file.originalname,
                        fileSize: req.file.size,
                        mimeType: req.file.mimetype
                    }
                );
            }

            // Create medical file record
            const medicalFile = new MedicalFile({
                patientId,
                healthRecordId,
                fileType,
                ipfsHash: ipfsResult.ipfsHash,
                encryptionKey: ipfsResult.encryptionKey,
                metadata: {
                    ...JSON.parse(metadata),
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedBy: req.user._id
                },
                accessControl: {
                    allowedUsers: [patientId, req.user._id],
                    allowedRoles: ['ADMIN']
                }
            });

            await medicalFile.save();

            // Pin the file to ensure availability
            await ipfsService.pinFile(ipfsResult.ipfsHash);

            res.status(201).json({
                message: 'File uploaded successfully',
                fileId: medicalFile._id,
                ipfsHash: medicalFile.ipfsHash
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to upload file' });
        }
    }
);

// Get medical file
router.get('/:fileId',
    authenticate,
    async (req, res) => {
        try {
            const { fileId } = req.params;
            const medicalFile = await MedicalFile.findById(fileId);

            if (!medicalFile) {
                return res.status(404).json({ error: 'File not found' });
            }

            // Check access permission
            if (!medicalFile.accessControl.allowedUsers.includes(req.user._id.toString()) &&
                !medicalFile.accessControl.allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get file from IPFS
            const file = await ipfsService.getFile(
                medicalFile.ipfsHash,
                medicalFile.encryptionKey
            );

            // Set appropriate headers
            res.setHeader('Content-Type', medicalFile.metadata.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${medicalFile.metadata.fileName}"`);

            // Send file
            res.send(file.data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve file' });
        }
    }
);

// Get patient's medical files
router.get('/patient/:patientId',
    authenticate,
    authorize('DOCTOR', 'HEALTHCARE_PROVIDER', 'ADMIN', 'PATIENT'),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const { type, startDate, endDate } = req.query;

            // Verify access for non-admin users
            if (req.user._id.toString() !== patientId && 
                req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Build query
            const query = { patientId, status: 'ACTIVE' };
            if (type) query.fileType = type;
            if (startDate || endDate) {
                query['metadata.uploadDate'] = {};
                if (startDate) query['metadata.uploadDate'].$gte = new Date(startDate);
                if (endDate) query['metadata.uploadDate'].$lte = new Date(endDate);
            }

            const files = await MedicalFile.find(query)
                .sort({ 'metadata.uploadDate': -1 });

            res.json(files);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve files' });
        }
    }
);

// Delete medical file (soft delete)
router.delete('/:fileId',
    authenticate,
    authorize('DOCTOR', 'HEALTHCARE_PROVIDER', 'ADMIN'),
    async (req, res) => {
        try {
            const { fileId } = req.params;
            const medicalFile = await MedicalFile.findById(fileId);

            if (!medicalFile) {
                return res.status(404).json({ error: 'File not found' });
            }

            // Verify ownership or admin
            if (medicalFile.metadata.uploadedBy !== req.user._id.toString() &&
                req.user.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Not authorized to delete this file' });
            }

            // Soft delete
            medicalFile.status = 'DELETED';
            await medicalFile.save();

            // Unpin from IPFS (but don't delete, as other nodes might need it)
            await ipfsService.unpinFile(medicalFile.ipfsHash);

            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete file' });
        }
    }
);

export default router;
