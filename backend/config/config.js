import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on NODE_ENV
const environment = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, `${environment}.env`);

// Load environment-specific variables
dotenv.config({ path: envPath });

// Configuration object
const config = {
    server: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/uhc_db'
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION || '24h'
    },
    blockchain: {
        provider: process.env.WEB3_PROVIDER || 'http://localhost:8545',
        contracts: {
            UHCIdentity: process.env.UHC_IDENTITY_ADDRESS,
            UHCAccessControl: process.env.UHC_ACCESS_CONTROL_ADDRESS,
            HealthRecordRegistry: process.env.HEALTH_RECORD_REGISTRY_ADDRESS,
            EmergencyAccess: process.env.EMERGENCY_ACCESS_ADDRESS,
            HealthDataStorage: process.env.HEALTH_DATA_STORAGE_ADDRESS,
            IPFSStorageConnector: process.env.IPFS_STORAGE_CONNECTOR_ADDRESS,
            PrivacyGuard: process.env.PRIVACY_GUARD_ADDRESS,
            SelectiveDisclosure: process.env.SELECTIVE_DISCLOSURE_ADDRESS,
            UHCToken: process.env.UHC_TOKEN_ADDRESS,
            RewardMechanism: process.env.REWARD_MECHANISM_ADDRESS
        }
    },
    ipfs: {
        nodeUrl: process.env.IPFS_NODE || 'http://localhost:5001'
    },
    healthcare: {
        fhirApiKey: process.env.FHIR_API_KEY,
        hl7ApiKey: process.env.HL7_API_KEY
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY,
        iv: process.env.IV_KEY
    }
};

// Validate required configuration
const requiredConfig = [
    'jwt.secret',
    'blockchain.contractAddress',
    'healthcare.fhirApiKey',
    'healthcare.hl7ApiKey',
    'encryption.key',
    'encryption.iv'
];

const validateConfig = () => {
    const missingConfig = requiredConfig.filter(path => {
        const keys = path.split('.');
        let current = config;
        for (const key of keys) {
            if (!current[key]) return true;
            current = current[key];
        }
        return false;
    });

    if (missingConfig.length > 0) {
        throw new Error(`Missing required configuration: ${missingConfig.join(', ')}`);
    }
};

// Export configuration
const configExport = {
    ...config,
    validateConfig
};

export default configExport;
