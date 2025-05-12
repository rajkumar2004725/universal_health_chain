import { create } from 'ipfs-http-client';
import config from '../config/config.js';
import { encryptData, decryptData } from '../utils/encryption.js';

class IPFSService {
    constructor() {
        this.ipfs = create({ url: config.ipfs.nodeUrl });
    }

    async uploadFile(fileBuffer, metadata) {
        try {
            // Encrypt file buffer
            const encryptedData = encryptData(fileBuffer);

            // Prepare IPFS object with encrypted data and metadata
            const ipfsObject = {
                data: encryptedData.data,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                    encryptionKey: encryptedData.key
                }
            };

            // Upload to IPFS
            const result = await this.ipfs.add(JSON.stringify(ipfsObject));
            
            return {
                ipfsHash: result.path,
                encryptionKey: encryptedData.key
            };
        } catch (error) {
            throw new Error('Failed to upload file to IPFS: ' + error.message);
        }
    }

    async getFile(ipfsHash, encryptionKey) {
        try {
            // Get file from IPFS
            const chunks = [];
            for await (const chunk of this.ipfs.cat(ipfsHash)) {
                chunks.push(chunk);
            }
            
            // Parse IPFS object
            const ipfsObject = JSON.parse(Buffer.concat(chunks).toString());
            
            // Decrypt file data
            const decryptedData = decryptData(
                { data: ipfsObject.data },
                encryptionKey
            );

            return {
                data: decryptedData,
                metadata: ipfsObject.metadata
            };
        } catch (error) {
            throw new Error('Failed to get file from IPFS: ' + error.message);
        }
    }

    async uploadMedicalImage(imageBuffer, metadata) {
        try {
            // Additional validation for medical images
            if (!metadata.imageType || !metadata.studyType) {
                throw new Error('Missing required metadata for medical image');
            }

            // Add medical image specific metadata
            const medicalMetadata = {
                ...metadata,
                contentType: 'medical-image',
                format: metadata.imageType,
                studyType: metadata.studyType,
                dicomTags: metadata.dicomTags || {}
            };

            return await this.uploadFile(imageBuffer, medicalMetadata);
        } catch (error) {
            throw new Error('Failed to upload medical image: ' + error.message);
        }
    }

    async uploadMedicalReport(reportBuffer, metadata) {
        try {
            // Additional validation for medical reports
            if (!metadata.reportType || !metadata.authorId) {
                throw new Error('Missing required metadata for medical report');
            }

            // Add medical report specific metadata
            const reportMetadata = {
                ...metadata,
                contentType: 'medical-report',
                reportType: metadata.reportType,
                authorId: metadata.authorId,
                institution: metadata.institution || 'Unknown'
            };

            return await this.uploadFile(reportBuffer, reportMetadata);
        } catch (error) {
            throw new Error('Failed to upload medical report: ' + error.message);
        }
    }

    async pinFile(ipfsHash) {
        try {
            await this.ipfs.pin.add(ipfsHash);
            return true;
        } catch (error) {
            throw new Error('Failed to pin file: ' + error.message);
        }
    }

    async unpinFile(ipfsHash) {
        try {
            await this.ipfs.pin.rm(ipfsHash);
            return true;
        } catch (error) {
            throw new Error('Failed to unpin file: ' + error.message);
        }
    }
}

const ipfsService = new IPFSService();
export default ipfsService;
