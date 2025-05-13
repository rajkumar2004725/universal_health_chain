// Core Contracts
import HealthRecordABI from '../core/HealthRecordRegistry.json';
import UHCIdentityABI from '../core/UHCIdentity.json';
import UHCAccessControlABI from '../core/UHCAccessControl.json';
import EmergencyAccessABI from '../core/EmergencyAccess.json';

// Storage Contracts
import HealthDataStorageABI from '../storage/HealthDataStorage.json';
import IPFSStorageConnectorABI from '../storage/IPFSStorageConnector.json';

// Privacy Contracts
import PrivacyGuardABI from '../privacy/PrivacyGuard.json';
import SelectiveDisclosureABI from '../privacy/SelectiveDisclosure.json';

// Token Contracts
import UHCTokenABI from '../tokens/UHCToken.json';
import RewardMechanismABI from '../tokens/RewardMechanism.json';

export {
    // Core
    HealthRecordABI,
    UHCIdentityABI,
    UHCAccessControlABI,
    EmergencyAccessABI,
    // Storage
    HealthDataStorageABI,
    IPFSStorageConnectorABI,
    // Privacy
    PrivacyGuardABI,
    SelectiveDisclosureABI,
    // Tokens
    UHCTokenABI,
    RewardMechanismABI
};
