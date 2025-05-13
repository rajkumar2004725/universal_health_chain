export interface BlockchainConfig {
    healthRecordAddress?: string;
    clinicalTrialAddress?: string;
    consentAddress?: string;
    ipfsGateway: string;
    blockchainNetwork?: string;
    contracts: {
        UHCIdentity: string;
        UHCAccessControl: string;
        HealthRecordRegistry: string;
        EmergencyAccess: string;
        HealthDataStorage: string;
        IPFSStorageConnector: string;
        PrivacyGuard: string;
        SelectiveDisclosure: string;
        UHCToken: string;
        RewardMechanism: string;
        ClinicalTrial?: string;
    };
}
