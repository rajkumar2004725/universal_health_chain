import mongoose from 'mongoose';

const clinicalTrialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    criteria: [{
        type: {
            type: String,
            enum: ['AGE', 'GENDER', 'CONDITION', 'MEDICATION', 'OTHER'],
            required: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        description: String
    }],
    compensation: {
        type: Number,
        required: [true, 'Compensation amount is required']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    researcher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Researcher is required']
    },
    status: {
        type: String,
        enum: ['RECRUITING', 'ACTIVE', 'COMPLETED', 'SUSPENDED'],
        default: 'RECRUITING'
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'WITHDRAWN'],
            default: 'PENDING'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: Date,
        withdrawnAt: Date,
        withdrawalReason: String,
        dataPoints: [{
            ipfsHash: {
                type: String,
                required: true
            },
            encryptionKey: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    blockchain: {
        transactionHash: String,
        blockNumber: Number
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
clinicalTrialSchema.index({ status: 1 });
clinicalTrialSchema.index({ researcher: 1 });
clinicalTrialSchema.index({ 'participants.user': 1 });

// Virtual for participant count
clinicalTrialSchema.virtual('participantCount').get(function() {
    return this.participants.length;
});

// Virtual for active participant count
clinicalTrialSchema.virtual('activeParticipantCount').get(function() {
    return this.participants.filter(p => p.status === 'ACTIVE').length;
});

// Methods
clinicalTrialSchema.methods.isEligible = function(user) {
    // Check each criterion
    return this.criteria.every(criterion => {
        switch (criterion.type) {
            case 'AGE':
                const age = (new Date().getFullYear()) - (new Date(user.profile.dateOfBirth).getFullYear());
                return age >= criterion.value.min && age <= criterion.value.max;
            
            case 'GENDER':
                return user.profile.gender === criterion.value;
            
            case 'CONDITION':
                return user.medicalHistory.some(h => 
                    h.condition.toLowerCase() === criterion.value.toLowerCase()
                );
            
            case 'MEDICATION':
                return user.medications.some(m => 
                    m.name.toLowerCase() === criterion.value.toLowerCase()
                );
            
            default:
                return true;
        }
    });
};

// Pre-save middleware
clinicalTrialSchema.pre('save', function(next) {
    // Update participant status timestamps
    this.participants.forEach(participant => {
        if (participant.status === 'COMPLETED' && !participant.completedAt) {
            participant.completedAt = new Date();
        }
        if (participant.status === 'WITHDRAWN' && !participant.withdrawnAt) {
            participant.withdrawnAt = new Date();
        }
    });
    next();
});

const ClinicalTrial = mongoose.model('ClinicalTrial', clinicalTrialSchema);
export default ClinicalTrial;
