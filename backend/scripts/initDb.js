import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import config from '../config/config.js';

const initializeDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.database.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check if admin user exists
        const adminExists = await User.findOne({ role: 'ADMIN' });
        if (!adminExists) {
            // Create admin user
            const adminPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                username: 'admin',
                email: 'admin@uhc.com',
                password: adminPassword,
                role: 'ADMIN',
                profile: {
                    firstName: 'Admin',
                    lastName: 'User',
                    contactNumber: '+1234567890'
                },
                status: 'ACTIVE'
            });
            console.log('Admin user created');
        }

        // Create test doctor
        const doctorExists = await User.findOne({ email: 'doctor@uhc.com' });
        if (!doctorExists) {
            const doctorPassword = await bcrypt.hash('doctor123', 10);
            await User.create({
                username: 'doctor',
                email: 'doctor@uhc.com',
                password: doctorPassword,
                role: 'DOCTOR',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    dateOfBirth: new Date('1980-01-01'),
                    gender: 'MALE',
                    contactNumber: '+1234567891'
                },
                professionalInfo: {
                    license: 'MED123456',
                    specialization: 'General Medicine',
                    organization: 'UHC Hospital',
                    experience: 15
                },
                status: 'ACTIVE'
            });
            console.log('Test doctor created');
        }

        // Create test patient
        const patientExists = await User.findOne({ email: 'patient@uhc.com' });
        if (!patientExists) {
            const patientPassword = await bcrypt.hash('patient123', 10);
            await User.create({
                username: 'patient',
                email: 'patient@uhc.com',
                password: patientPassword,
                role: 'PATIENT',
                profile: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    dateOfBirth: new Date('1990-01-01'),
                    gender: 'FEMALE',
                    contactNumber: '+1234567892',
                    address: {
                        street: '123 Health St',
                        city: 'Medicity',
                        state: 'Healthcare',
                        country: 'Medical Land',
                        zipCode: '12345'
                    }
                },
                status: 'ACTIVE'
            });
            console.log('Test patient created');
        }

        console.log('Database initialization completed');
    } catch (error) {
        console.error('Database initialization failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

// Run initialization if this script is run directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    initializeDatabase();
}

export default initializeDatabase;
