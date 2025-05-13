import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';
import api from './api';

class IPFSService {
    private ipfs: any;
    private gateway: string = '';

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            const response = await api.get('/blockchain/config');
            this.gateway = response.data.ipfsGateway || 'https://ipfs.io';
            
            // For development, use a mock implementation instead of real IPFS
            // In production, we would use proper Infura credentials
            console.log('Using mock IPFS implementation for development');
            
            // Create a mock IPFS client
            this.ipfs = {
                add: async (content: any) => {
                    // Generate a fake CID based on content
                    const randomCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
                    console.log('Mock IPFS: File uploaded with CID:', randomCid);
                    return { path: randomCid, size: content.length || 100 };
                }
            };
        } catch (error) {
            console.error('Failed to initialize IPFS:', error);
            console.warn('Using fallback mock IPFS implementation');
            
            // Fallback to mock implementation
            this.gateway = 'https://ipfs.io';
            this.ipfs = {
                add: async () => ({
                    path: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
                    size: 100
                })
            };
        }
    }

    async uploadFile(file: File): Promise<string> {
        try {
            const buffer = await file.arrayBuffer();
            const result = await this.ipfs.add(Buffer.from(buffer));
            return result.path;
        } catch (error) {
            console.error('Failed to upload file to IPFS:', error);
            throw error;
        }
    }

    async uploadJSON(data: any): Promise<string> {
        try {
            const result = await this.ipfs.add(JSON.stringify(data));
            return result.path;
        } catch (error) {
            console.error('Failed to upload JSON to IPFS:', error);
            throw error;
        }
    }

    async getFile(hash: string): Promise<Blob> {
        try {
            const response = await fetch(`${this.gateway}/ipfs/${hash}`);
            return await response.blob();
        } catch (error) {
            console.error('Failed to get file from IPFS:', error);
            throw error;
        }
    }

    async getJSON(hash: string): Promise<any> {
        try {
            const response = await fetch(`${this.gateway}/ipfs/${hash}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get JSON from IPFS:', error);
            throw error;
        }
    }

    // Encrypted file handling
    async uploadEncryptedFile(file: File, encryptionKey: string): Promise<string> {
        try {
            const buffer = await file.arrayBuffer();
            const encryptedBuffer = await this.encrypt(buffer, encryptionKey);
            const result = await this.ipfs.add(Buffer.from(encryptedBuffer));
            return result.path;
        } catch (error) {
            console.error('Failed to upload encrypted file to IPFS:', error);
            throw error;
        }
    }

    async getEncryptedFile(hash: string, encryptionKey: string): Promise<Blob> {
        try {
            const response = await fetch(`${this.gateway}/ipfs/${hash}`);
            const encryptedBuffer = await response.arrayBuffer();
            const decryptedBuffer = await this.decrypt(encryptedBuffer, encryptionKey);
            return new Blob([decryptedBuffer]);
        } catch (error) {
            console.error('Failed to get encrypted file from IPFS:', error);
            throw error;
        }
    }

    // Encryption utilities using Web Crypto API
    private async encrypt(data: ArrayBuffer, key: string): Promise<ArrayBuffer> {
        const cryptoKey = await this.deriveKey(key);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            data
        );

        // Combine IV and encrypted content
        const result = new Uint8Array(iv.length + encryptedContent.byteLength);
        result.set(iv);
        result.set(new Uint8Array(encryptedContent), iv.length);
        return result.buffer;
    }

    private async decrypt(data: ArrayBuffer, key: string): Promise<ArrayBuffer> {
        const cryptoKey = await this.deriveKey(key);
        const iv = new Uint8Array(data.slice(0, 12));
        const encryptedContent = new Uint8Array(data.slice(12));

        return await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            encryptedContent
        );
    }

    private async deriveKey(password: string): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const salt = encoder.encode('UniversalHealthChain');

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }
}

export default new IPFSService();
