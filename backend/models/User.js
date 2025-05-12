import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['PATIENT', 'DOCTOR', 'ADMIN', 'HEALTHCARE_PROVIDER'],
        required: true
    },
    profile: {
        firstName: String,
        lastName: String,
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['MALE', 'FEMALE', 'OTHER']
        },
        contactNumber: String,
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        }
    },
    professionalInfo: {
        license: String,
        specialization: String,
        organization: String,
        experience: Number
    },
    blockchainAddress: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
