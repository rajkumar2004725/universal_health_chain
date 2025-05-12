const hre = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy core contracts
    const UHCIdentity = await ethers.getContractFactory("UHCIdentity");
    const identity = await UHCIdentity.deploy();
    await identity.waitForDeployment();
    const identityAddress = await identity.getAddress();
    console.log("UHCIdentity deployed to:", identityAddress);

    const UHCAccessControl = await ethers.getContractFactory("UHCAccessControl");
    const accessControl = await UHCAccessControl.deploy(identityAddress);
    await accessControl.waitForDeployment();
    const accessControlAddress = await accessControl.getAddress();
    console.log("UHCAccessControl deployed to:", accessControlAddress);

    const HealthRecordRegistry = await ethers.getContractFactory("HealthRecordRegistry");
    const registry = await HealthRecordRegistry.deploy(accessControlAddress);
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("HealthRecordRegistry deployed to:", registryAddress);

    const EmergencyAccess = await ethers.getContractFactory("EmergencyAccess");
    const emergency = await EmergencyAccess.deploy(accessControlAddress);
    await emergency.waitForDeployment();
    const emergencyAddress = await emergency.getAddress();
    console.log("EmergencyAccess deployed to:", emergencyAddress);

    // Deploy storage contracts
    const HealthDataStorage = await ethers.getContractFactory("HealthDataStorage");
    const storage = await HealthDataStorage.deploy(accessControlAddress);
    await storage.waitForDeployment();
    const storageAddress = await storage.getAddress();
    console.log("HealthDataStorage deployed to:", storageAddress);

    const IPFSStorageConnector = await ethers.getContractFactory("IPFSStorageConnector");
    const ipfsConnector = await IPFSStorageConnector.deploy(storageAddress);
    await ipfsConnector.waitForDeployment();
    const ipfsConnectorAddress = await ipfsConnector.getAddress();
    console.log("IPFSStorageConnector deployed to:", ipfsConnectorAddress);

    // Deploy privacy contracts
    const PrivacyGuard = await ethers.getContractFactory("PrivacyGuard");
    const privacy = await PrivacyGuard.deploy();
    await privacy.waitForDeployment();
    const privacyAddress = await privacy.getAddress();
    console.log("PrivacyGuard deployed to:", privacyAddress);

    const SelectiveDisclosure = await ethers.getContractFactory("SelectiveDisclosure");
    const disclosure = await SelectiveDisclosure.deploy();
    await disclosure.waitForDeployment();
    const disclosureAddress = await disclosure.getAddress();
    console.log("SelectiveDisclosure deployed to:", disclosureAddress);

    // Deploy token contracts
    const UHCToken = await ethers.getContractFactory("UHCToken");
    const token = await UHCToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("UHCToken deployed to:", tokenAddress);

    const RewardMechanism = await ethers.getContractFactory("RewardMechanism");
    const rewards = await RewardMechanism.deploy(tokenAddress, identityAddress);
    await rewards.waitForDeployment();
    const rewardsAddress = await rewards.getAddress();
    console.log("RewardMechanism deployed to:", rewardsAddress);

    // Save deployment addresses
    const deployments = {
        UHCIdentity: identityAddress,
        UHCAccessControl: accessControlAddress,
        HealthRecordRegistry: registryAddress,
        EmergencyAccess: emergencyAddress,
        HealthDataStorage: storageAddress,
        IPFSStorageConnector: ipfsConnectorAddress,
        PrivacyGuard: privacyAddress,
        SelectiveDisclosure: disclosureAddress,
        UHCToken: tokenAddress,
        RewardMechanism: rewardsAddress
    };

    // Save addresses to a file
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    fs.writeFileSync(
        path.join(deploymentsDir, 'addresses.json'),
        JSON.stringify(deployments, null, 2)
    );

    console.log("\nDeployment completed successfully!");
    console.log("Contract addresses saved to deployments/addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
