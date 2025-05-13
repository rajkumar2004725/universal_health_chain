export class BlockchainError extends Error {
    constructor(message: string, public originalError?: any) {
        super(message);
        this.name = 'BlockchainError';
    }
}

export class ContractError extends BlockchainError {
    constructor(message: string, public contractName: string, originalError?: any) {
        super(message, originalError);
        this.name = 'ContractError';
    }
}
