import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import logger from './utils/logger.js';
import connectDB from './config/database.js';
import errorHandler from './middleware/error.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to Database
connectDB(process.env.MONGODB_URI);

// Basic middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Routes
import authRoutes from './routes/auth.routes.js';
import healthRecordsRoutes from './routes/healthRecords.routes.js';
import storageRoutes from './routes/storage.routes.js';
import clinicalTrialsRoutes from './routes/clinicalTrials.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import blockchainRoutes from './routes/blockchain.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/health-records', healthRecordsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/clinical-trials', clinicalTrialsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Initialize blockchain service
import initBlockchain from './scripts/initBlockchain.js';
try {
    await initBlockchain();
} catch (err) {
    logger.error('Failed to initialize blockchain service:', err);
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Handle 404
// Error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app; // Export for testing
