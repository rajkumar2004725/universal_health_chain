import api from './api';
import { Buffer } from 'buffer';

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
}

export interface EncryptionKey {
    publicKey: string;
    privateKey?: string;
}

export interface EncryptedData {
    data: string;
    iv: string;
    ephemPublicKey: string;
    mac: string;
}

class PrivacyService {
    private keyPair: EncryptionKey | null = null;

    // Key Management
    async generateKeyPair(): Promise<EncryptionKey> {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-256'
            },
            true,
            ['deriveKey']
        );

        const publicKey = await window.crypto.subtle.exportKey(
            'jwk',
            keyPair.publicKey
        );

        const privateKey = await window.crypto.subtle.exportKey(
            'jwk',
            keyPair.privateKey
        );

        this.keyPair = {
            publicKey: JSON.stringify(publicKey),
            privateKey: JSON.stringify(privateKey)
        };

        return this.keyPair;
    }

    // Homomorphic Encryption
    async encryptHomomorphic(data: number[]): Promise<string> {
        const response = await api.post('/privacy/homomorphic/encrypt', { data });
        return response.data.encryptedData;
    }

    async computeHomomorphic(
        operation: 'add' | 'multiply',
        encryptedData1: string,
        encryptedData2: string
    ): Promise<string> {
        const response = await api.post('/privacy/homomorphic/compute', {
            operation,
            data1: encryptedData1,
            data2: encryptedData2
        });
        return response.data.result;
    }

    async decryptHomomorphic(encryptedData: string): Promise<number[]> {
        const response = await api.post('/privacy/homomorphic/decrypt', {
            encryptedData
        });
        return response.data.decryptedData;
    }

    // Secure Multi-Party Computation
    async initiateMPC(
        participants: string[],
        computation: string
    ): Promise<string> {
        const response = await api.post('/privacy/mpc/initiate', {
            participants,
            computation
        });
        return response.data.sessionId;
    }

    async contributeMPCInput(
        sessionId: string,
        input: any,
        participant: string
    ): Promise<void> {
        await api.post('/privacy/mpc/contribute', {
            sessionId,
            input,
            participant
        });
    }

    async getMPCResult(sessionId: string): Promise<any> {
        const response = await api.get(`/privacy/mpc/result/${sessionId}`);
        return response.data.result;
    }

    // Zero-Knowledge Proofs
    async generateZKProof(
        statement: any,
        privateInput: any
    ): Promise<{ proof: string; publicInput: any }> {
        const response = await api.post('/privacy/zkp/generate', {
            statement,
            privateInput
        });
        return response.data;
    }

    async verifyZKProof(
        proof: string,
        publicInput: any,
        statement: any
    ): Promise<boolean> {
        const response = await api.post('/privacy/zkp/verify', {
            proof,
            publicInput,
            statement
        });
        return response.data.valid;
    }

    // Differential Privacy
    async addNoise(
        data: number[],
        epsilon: number,
        sensitivity: number
    ): Promise<number[]> {
        const response = await api.post('/privacy/differential/noise', {
            data,
            epsilon,
            sensitivity
        });
        return response.data.noisyData;
    }

    async computePrivateStatistics(
        data: number[],
        statistics: string[],
        epsilon: number
    ): Promise<Record<string, number>> {
        const response = await api.post('/privacy/differential/statistics', {
            data,
            statistics,
            epsilon
        });
        return response.data.results;
    }

    // Secure Data Sharing
    async generateSharingKey(): Promise<string> {
        const key = await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
        const exportedKey = await window.crypto.subtle.exportKey('raw', key);
        // Convert ArrayBuffer to base64 string without using Buffer
        const bytes = new Uint8Array(exportedKey);
        const binaryString = bytes.reduce((str, byte) => str + String.fromCharCode(byte), '');
        return btoa(binaryString);
    }

    
    async encryptForSharing(data: any, recipientPublicKey: string): Promise<EncryptedData> {
        const response = await api.post('/privacy/sharing/encrypt', {
            data,
            recipientPublicKey
        });
        return response.data;
    }

    async decryptShared(encryptedData: EncryptedData): Promise<any> {
        if (!this.keyPair?.privateKey) {
            throw new Error('No private key available');
        }

        const response = await api.post('/privacy/sharing/decrypt', {
            encryptedData,
            privateKey: this.keyPair.privateKey
        });
        return response.data.decryptedData;
    }

    // Secure Aggregation
    async contributeToAggregation(
        sessionId: string,
        data: number[],
        mask: number[]
    ): Promise<void> {
        await api.post('/privacy/aggregation/contribute', {
            sessionId,
            data,
            mask
        });
    }

    async getAggregationResult(sessionId: string): Promise<number[]> {
        const response = await api.get(`/privacy/aggregation/result/${sessionId}`);
        return response.data.result;
    }

    // Privacy-Preserving Machine Learning
    async trainPrivateModel(params: {
        model: string;
        data: any;
        epsilon: number;
    }): Promise<string> {
        const response = await api.post('/privacy/ml/train', params);
        return response.data.modelId;
    }

    async predictPrivate(modelId: string, input: any): Promise<any> {
        const response = await api.post(`/privacy/ml/predict/${modelId}`, {
            input
        });
        return response.data.prediction;
    }
}

export default new PrivacyService();
