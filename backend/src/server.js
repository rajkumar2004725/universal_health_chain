import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import path from 'path';
import { config } from 'dotenv';
config();

import connectDB from '../config/database.js';
import logger from '../utils/logger.js';
import errorHandler from '../middleware/error.js';
import swaggerSpec from '../docs/swagger.js';

const app = express();

// Connect to Database
connectDB(process.env.MONGODB_URI);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
import authRoutes from '../routes/auth.routes.js';
import healthRecordRoutes from '../routes/healthRecords.routes.js';
import storageRoutes from '../routes/storage.routes.js';
import clinicalTrialRoutes from '../routes/clinicalTrials.routes.js';
import analyticsRoutes from '../routes/analytics.routes.js';
import userRoutes from '../routes/users.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/clinical-trials', clinicalTrialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Initialize blockchain service
import initBlockchain from '../scripts/initBlockchain.js';
initBlockchain().catch(err => {
    logger.error('Failed to initialize blockchain service:', err);
});

// Serve static files from the uploads directory
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

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
const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});

export default app; // Export for testing
