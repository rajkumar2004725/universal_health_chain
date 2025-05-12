import Web3 from 'web3';
import config from '../config/config.js';

class BlockchainService {
    constructor() {
        this.web3 = new Web3(config.blockchain.provider);
        this.contractAddress = config.blockchain.contractAddress;
        // We'll load the contract ABI from our smart contracts
        this.contract = null;
    }

    async initContract(abi) {
        try {
            this.contract = new this.web3.eth.Contract(abi, this.contractAddress);
        } catch (error) {
            throw new Error('Failed to initialize contract: ' + error.message);
        }
    }

    async addHealthRecord(recordHash, patientAddress, doctorAddress) {
        try {
            const tx = await this.contract.methods
                .addHealthRecord(recordHash, patientAddress)
                .send({ from: doctorAddress });
            return tx;
        } catch (error) {
            throw new Error('Failed to add health record: ' + error.message);
        }
    }

    async getHealthRecord(recordHash) {
        try {
            const record = await this.contract.methods
                .getHealthRecord(recordHash)
                .call();
            return record;
        } catch (error) {
            throw new Error('Failed to get health record: ' + error.message);
        }
    }

    async grantAccess(recordHash, toAddress, fromAddress) {
        try {
            const tx = await this.contract.methods
                .grantAccess(recordHash, toAddress)
                .send({ from: fromAddress });
            return tx;
        } catch (error) {
            throw new Error('Failed to grant access: ' + error.message);
        }
    }

    async revokeAccess(recordHash, fromAddress, toAddress) {
        try {
            const tx = await this.contract.methods
                .revokeAccess(recordHash, fromAddress)
                .send({ from: toAddress });
            return tx;
        } catch (error) {
            throw new Error('Failed to revoke access: ' + error.message);
        }
    }

    async verifyAccess(recordHash, address) {
        try {
            const hasAccess = await this.contract.methods
                .verifyAccess(recordHash, address)
                .call();
            return hasAccess;
        } catch (error) {
            throw new Error('Failed to verify access: ' + error.message);
        }
    }
}

const blockchainService = new BlockchainService();
export default blockchainService;
