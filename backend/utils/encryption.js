import crypto from 'crypto';
import config from '../config/config.js';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(config.encryption.key, 'hex');
const iv = Buffer.from(config.encryption.iv, 'hex');

const encryptData = (data) => {
    try {
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(data)),
            cipher.final()
        ]);

        return {
            data: encrypted.toString('hex'),
            key: key.toString('hex'),
            iv: iv.toString('hex')
        };
    } catch (error) {
        throw new Error('Encryption failed: ' + error.message);
    }
};

const decryptData = (encryptedData, encryptionKey) => {
    try {
        const decipher = crypto.createDecipheriv(
            algorithm,
            Buffer.from(encryptionKey, 'hex'),
            iv
        );
        
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedData.data, 'hex')),
            decipher.final()
        ]);

        return JSON.parse(decrypted.toString());
    } catch (error) {
        throw new Error('Decryption failed: ' + error.message);
    }
};

export {
    encryptData,
    decryptData
};
