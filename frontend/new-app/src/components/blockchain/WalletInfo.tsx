import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Chip,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import useBlockchainWallet from '../../hooks/useBlockchainWallet';

const WalletInfo: React.FC = () => {
    const {
        address,
        balance,
        isConnected,
        isCorrectNetwork,
        connectWallet,
        switchNetwork,
    } = useBlockchainWallet();

    const shortenAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    if (!isConnected) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" component="div">
                            Blockchain Wallet
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AccountBalanceWalletIcon />}
                            onClick={connectWallet}
                        >
                            Connect Wallet
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6" component="div">
                            Wallet Status
                        </Typography>
                        <Chip
                            label={isCorrectNetwork ? 'Connected' : 'Wrong Network'}
                            color={isCorrectNetwork ? 'success' : 'error'}
                            size="small"
                        />
                    </Box>

                    {address && (
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Address
                            </Typography>
                            <Tooltip title={address}>
                                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                    {shortenAddress(address)}
                                </Typography>
                            </Tooltip>
                        </Box>
                    )}

                    {balance && (
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Balance
                            </Typography>
                            <Typography variant="body1">
                                {parseFloat(balance).toFixed(4)} ETH
                            </Typography>
                        </Box>
                    )}

                    {!isCorrectNetwork && (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<SwapHorizIcon />}
                            onClick={switchNetwork}
                            fullWidth
                        >
                            Switch Network
                        </Button>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export const WalletInfoSkeleton: React.FC = () => {
    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" py={3}>
                    <CircularProgress />
                </Box>
            </CardContent>
        </Card>
    );
};

export default WalletInfo;
