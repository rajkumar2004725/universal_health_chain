import Web3 from 'web3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class ContractService {
    constructor() {
        this.web3 = new Web3(config.blockchain.provider);
        this.contracts = {};
        this.accounts = [];
    }

    async init() {
        try {
            // Get network accounts
            this.accounts = await this.web3.eth.getAccounts();
            logger.info(`Connected to blockchain with ${this.accounts.length} accounts`);

            // Load contract artifacts
            const contractsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../smart-contracts/build/contracts/contracts');
            
            // Core contracts
            await this.loadContract('HealthRecordRegistry', contractsPath);
            await this.loadContract('UHCAccessControl', contractsPath);
            await this.loadContract('UHCIdentity', contractsPath);
            await this.loadContract('EmergencyAccess', contractsPath);

            // Storage contracts
            await this.loadContract('HealthDataStorage', contractsPath);
            await this.loadContract('IPFSStorageConnector', contractsPath);

            // Privacy contracts
            await this.loadContract('PrivacyGuard', contractsPath);
            await this.loadContract('SelectiveDisclosure', contractsPath);

            // Token contracts
            await this.loadContract('UHCToken', contractsPath);
            await this.loadContract('RewardMechanism', contractsPath);

            logger.info('Smart contracts loaded successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize contract service:', error);
            throw error;
        }
    }

    async loadContract(contractName, contractsPath) {
        try {
            // Contract directory mapping
            const contractDirMap = {
                'UHCIdentity': 'core',
                'UHCAccessControl': 'core',
                'HealthRecordRegistry': 'core',
                'EmergencyAccess': 'core',
                'HealthDataStorage': 'storage',
                'IPFSStorageConnector': 'storage',
                'PrivacyGuard': 'privacy',
                'SelectiveDisclosure': 'privacy',
                'UHCToken': 'tokens',
                'RewardMechanism': 'tokens'
            };

            const contractDir = contractDirMap[contractName];
            if (!contractDir) {
                throw new Error(`Unknown contract type: ${contractName}`);
            }

            const artifactPath = path.join(contractsPath, contractDir, `${contractName}.sol`, `${contractName}.json`);
            const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
            const contractAddress = config.blockchain.contracts[contractName];

            if (!contractAddress) {
                throw new Error(`No address found for ${contractName}`);
            }

            this.contracts[contractName] = new this.web3.eth.Contract(
                artifact.abi,
                contractAddress
            );

            logger.info(`Loaded ${contractName} at ${contractAddress}`);
        } catch (error) {
            logger.error(`Failed to load ${contractName}:`, error);
            throw error;
        }
    }

    // Health Record Functions
    async addHealthRecord(recordHash, patientAddress, metadata, from) {
        try {
            return await this.contracts.HealthRecordRegistry.methods
                .addHealthRecord(recordHash, patientAddress, metadata)
                .send({ from });
        } catch (error) {
            logger.error('Failed to add health record:', error);
            throw error;
        }
    }

    async grantAccess(recordHash, toAddress, from) {
        try {
            return await this.contracts.UHCAccessControl.methods
                .grantAccess(recordHash, toAddress)
                .send({ from });
        } catch (error) {
            logger.error('Failed to grant access:', error);
            throw error;
        }
    }

    // Identity Management
    async registerIdentity(address, role, metadata, from) {
        try {
            return await this.contracts.UHCIdentity.methods
                .registerIdentity(address, role, metadata)
                .send({ from });
        } catch (error) {
            logger.error('Failed to register identity:', error);
            throw error;
        }
    }

    async verifyIdentity(address) {
        try {
            return await this.contracts.UHCIdentity.methods
                .verifyIdentity(address)
                .call();
        } catch (error) {
            logger.error('Failed to verify identity:', error);
            throw error;
        }
    }

    // Storage Management
    async storeIPFSHash(recordId, ipfsHash, from) {
        try {
            return await this.contracts.IPFSStorageConnector.methods
                .storeHash(recordId, ipfsHash)
                .send({ from });
        } catch (error) {
            logger.error('Failed to store IPFS hash:', error);
            throw error;
        }
    }

    // Privacy Functions
    async createDisclosureProof(recordHash, fields, from) {
        try {
            return await this.contracts.SelectiveDisclosure.methods
                .createDisclosureProof(recordHash, fields)
                .send({ from });
        } catch (error) {
            logger.error('Failed to create disclosure proof:', error);
            throw error;
        }
    }

    // Token Functions
    async rewardUser(userAddress, amount, reason, from) {
        try {
            return await this.contracts.RewardMechanism.methods
                .rewardUser(userAddress, amount, reason)
                .send({ from });
        } catch (error) {
            logger.error('Failed to reward user:', error);
            throw error;
        }
    }

    // Emergency Access
    async grantEmergencyAccess(patientAddress, providerAddress, duration, from) {
        try {
            return await this.contracts.EmergencyAccess.methods
                .grantEmergencyAccess(patientAddress, providerAddress, duration)
                .send({ from });
        } catch (error) {
            logger.error('Failed to grant emergency access:', error);
            throw error;
        }
    }

    // Utility Functions
    async getTransactionReceipt(txHash) {
        try {
            return await this.web3.eth.getTransactionReceipt(txHash);
        } catch (error) {
            logger.error('Failed to get transaction receipt:', error);
            throw error;
        }
    }

    async estimateGas(contractName, methodName, params, from) {
        try {
            return await this.contracts[contractName].methods[methodName](...params)
                .estimateGas({ from });
        } catch (error) {
            logger.error('Failed to estimate gas:', error);
            throw error;
        }
    }
}

export default new ContractService();
