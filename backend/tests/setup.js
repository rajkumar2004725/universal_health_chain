import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

let mongoServer;

// Setup in-memory MongoDB for testing
before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

// Clear all collections after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

// Close MongoDB connection after all tests
after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Helper function to generate test JWT tokens
const generateTestToken = (userId, role = 'PATIENT') => {
    return jwt.sign(
        { userId, role },
        config.jwt.secret,
        { expiresIn: '1h' }
    );
};

// Mock blockchain service for testing
const mockBlockchainService = {
    addHealthRecord: async () => ({
        transactionHash: '0x123...',
        blockNumber: 1
    }),
    verifyAccess: async () => true
};

// Mock IPFS service for testing
const mockIPFSService = {
    uploadFile: async () => ({
        ipfsHash: 'Qm...',
        encryptionKey: 'test-key'
    }),
    getFile: async () => ({
        data: Buffer.from('test'),
        metadata: {}
    })
};

export {
    generateTestToken,
    mockBlockchainService,
    mockIPFSService
};
