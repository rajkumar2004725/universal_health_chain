import fs from 'fs';
import path from 'path';
import blockchainService from '../services/blockchain.service.js';
import contractService from '../services/contract.service.js';
import logger from '../utils/logger.js';

async function initBlockchain() {
    try {
        // Initialize contract service
        await contractService.init();
        
        // Deploy missing contracts if in development
        if (process.env.NODE_ENV === 'development') {
            await deployMissingContracts();
        }
        
        logger.info('Blockchain initialization completed successfully');
        return contractService;
    } catch (error) {
        logger.error('Failed to initialize blockchain:', error);
        throw error;
    }
}

async function deployMissingContracts() {
    try {
        const requiredContracts = [
            'HealthRecordRegistry',
            'UHCAccessControl',
            'UHCIdentity',
            'EmergencyAccess',
            'HealthDataStorage',
            'IPFSStorageConnector',
            'PrivacyGuard',
            'SelectiveDisclosure',
            'UHCToken',
            'RewardMechanism'
        ];

        for (const contractName of requiredContracts) {
            if (!contractService.contracts[contractName]) {
                logger.info(`Deploying ${contractName}...`);
                // This would call the deployment script for the specific contract
                // For now, we'll just log that it needs to be deployed
                logger.warn(`${contractName} needs to be deployed manually`);
            }
        }
    } catch (error) {
        logger.error('Failed to deploy missing contracts:', error);
        throw error;
    }
}

// Run initialization if this script is run directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
    initBlockchain().catch(console.error);
}

export default initBlockchain;
