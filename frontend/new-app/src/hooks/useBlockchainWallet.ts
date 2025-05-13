import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { useSnackbar } from 'notistack';
import blockchainService from '../services/blockchain.service';

export interface WalletState {
    address: string | null;
    balance: string | null;
    chainId: number | null; // Keep as number for compatibility
    isConnected: boolean;
    isCorrectNetwork: boolean;
}

const REQUIRED_CHAIN_ID = parseInt(process.env.REACT_APP_REQUIRED_CHAIN_ID || '1', 10);

export const useBlockchainWallet = () => {
    const [walletState, setWalletState] = useState<WalletState>({
        address: null,
        balance: null,
        chainId: null,
        isConnected: false,
        isCorrectNetwork: false,
    });

    const { enqueueSnackbar } = useSnackbar();

    const updateWalletState = useCallback(async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const web3 = new Web3(window.ethereum);
                const accounts = await web3.eth.getAccounts();
                
                if (accounts.length > 0) {
                    const address = accounts[0];
                    const balance = await web3.eth.getBalance(address);
                    const chainIdBigInt = await web3.eth.getChainId();
                    const chainId = Number(chainIdBigInt); // Convert bigint to number

                    setWalletState({
                        address,
                        balance: web3.utils.fromWei(balance, 'ether'),
                        chainId,
                        isConnected: true,
                        isCorrectNetwork: chainId === REQUIRED_CHAIN_ID,
                    });

                    // Initialize blockchain service with the connected wallet
                    await blockchainService.initialize();
                } else {
                    setWalletState({
                        address: null,
                        balance: null,
                        chainId: null,
                        isConnected: false,
                        isCorrectNetwork: false,
                    });
                }
            } catch (error) {
                console.error('Error updating wallet state:', error);
                enqueueSnackbar('Error connecting to wallet', { variant: 'error' });
            }
        }
    }, [enqueueSnackbar]);

    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                await updateWalletState();
                enqueueSnackbar('Wallet connected successfully', { variant: 'success' });
            } catch (error) {
                console.error('Error connecting wallet:', error);
                enqueueSnackbar('Error connecting wallet', { variant: 'error' });
            }
        } else {
            enqueueSnackbar('Please install MetaMask', { variant: 'warning' });
        }
    }, [updateWalletState, enqueueSnackbar]);

    const switchNetwork = useCallback(async () => {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}` }],
            });
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${REQUIRED_CHAIN_ID.toString(16)}`,
                                chainName: 'Required Network',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18,
                                },
                                rpcUrls: [process.env.REACT_APP_RPC_URL],
                                blockExplorerUrls: [process.env.REACT_APP_BLOCK_EXPLORER_URL],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    enqueueSnackbar('Error adding network', { variant: 'error' });
                }
            } else {
                console.error('Error switching network:', switchError);
                enqueueSnackbar('Error switching network', { variant: 'error' });
            }
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', updateWalletState);
            window.ethereum.on('chainChanged', updateWalletState);
            window.ethereum.on('connect', updateWalletState);
            window.ethereum.on('disconnect', updateWalletState);

            // Initial check
            updateWalletState();

            return () => {
                window.ethereum.removeListener('accountsChanged', updateWalletState);
                window.ethereum.removeListener('chainChanged', updateWalletState);
                window.ethereum.removeListener('connect', updateWalletState);
                window.ethereum.removeListener('disconnect', updateWalletState);
            };
        }
    }, [updateWalletState]);

    return {
        ...walletState,
        connectWallet,
        switchNetwork,
        updateWalletState,
    };
};

export default useBlockchainWallet;