import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    recordType: {
        type: String,
        required: true,
        enum: ['DIAGNOSIS', 'PRESCRIPTION', 'LAB_RESULT', 'VACCINATION', 'SURGERY', 'OTHER']
    },
    data: {
        type: Object,
        required: true
    },
    metadata: {
        createdBy: {
            type: String,
            required: true
        },
        facility: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    blockchain: {
        transactionHash: String,
        blockNumber: Number,
        timestamp: Date
    },
    ipfsHash: String,
    encryptionKey: {
        type: String,
        required: true
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
healthRecordSchema.index({ 'metadata.timestamp': -1 });
healthRecordSchema.index({ 'blockchain.blockNumber': 1 });
healthRecordSchema.index({ status: 1 });

const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
export default HealthRecord;
