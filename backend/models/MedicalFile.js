import mongoose from 'mongoose';

const medicalFileSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    healthRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthRecord',
        required: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['MEDICAL_IMAGE', 'LAB_REPORT', 'PRESCRIPTION_SCAN', 'OTHER']
    },
    ipfsHash: {
        type: String,
        required: true,
        unique: true
    },
    encryptionKey: {
        type: String,
        required: true
    },
    metadata: {
        fileName: String,
        fileSize: Number,
        mimeType: String,
        uploadedBy: {
            type: String,
            required: true
        },
        uploadDate: {
            type: Date,
            default: Date.now
        },
        imageType: String,      // For medical images (e.g., X-RAY, MRI, CT)
        studyType: String,      // For medical images
        reportType: String,     // For reports
        institution: String,    // Healthcare facility
        dicomTags: Object      // For DICOM images
    },
    accessControl: {
        allowedUsers: [{
            type: String
        }],
        allowedRoles: [{
            type: String
        }]
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'ARCHIVED', 'DELETED'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
medicalFileSchema.index({ 'metadata.uploadDate': -1 });
medicalFileSchema.index({ fileType: 1 });
medicalFileSchema.index({ status: 1 });

export default mongoose.model('MedicalFile', medicalFileSchema);
