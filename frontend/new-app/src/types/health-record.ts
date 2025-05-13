export interface HealthRecord {
    id: string;
    title?: string;
    description?: string;
    recordType: string;
    timestamp: number;
    data: string; // IPFS hash or encrypted data
    metadata?: Record<string, any>;
    owner: string;
    accessList?: string[]; // List of addresses with access
}
