import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import http from 'http';

import logger from './utils/logger.js';
import connectDB from './config/database.js';
import errorHandler from './middleware/error.js';
// Import routes at the top
import authRoutes from './routes/auth.routes.js';
import healthRecordsRoutes from './routes/healthRecords.routes.js';
import storageRoutes from './routes/storage.routes.js';
import clinicalTrialsRoutes from './routes/clinicalTrials.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import blockchainRoutes from './routes/blockchain.routes.js';
import { initWebSocketServer } from './services/websocket.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to Database
connectDB(process.env.MONGODB_URI);

// Basic middleware
app.use(helmet());

// Enable CORS for all routes
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logger.stream }));

// Mount routes before test routes
console.log('Mounting routes...');

// API routes
const apiRouter = express.Router();

// Mount all API routes under /api
app.use('/api', (req, res, next) => {
    console.log(`API route accessed: ${req.method} ${req.originalUrl}`);
    next();
}, apiRouter);

apiRouter.use('/auth', authRoutes);
apiRouter.use('/health-records', healthRecordsRoutes);
apiRouter.use('/storage', storageRoutes);
apiRouter.use('/clinical-trials', clinicalTrialsRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/blockchain', blockchainRoutes);

// Test routes
app.get('/api/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'API is working!' });
});

app.get('/', (req, res) => {
    console.log('Root route hit');
    res.send('Server is running');
});

// Log all available routes
console.log('Mounted routes:');
console.log('GET /');
console.log('GET /api/test');
console.log('POST /api/auth/test');
console.log('Auth routes:');
console.log('  POST /api/auth/login');
console.log('  POST /api/auth/register');
console.log('  GET /api/auth/me');
console.log('Other API routes:');
console.log('  /api/health-records');
console.log('  /api/storage');
console.log('  /api/clinical-trials');
console.log('  /api/analytics');
console.log('  /api/blockchain');

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

const PORT = 3001; // Explicitly set to match frontend configuration

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = initWebSocketServer(server);

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app; // Export for testing
