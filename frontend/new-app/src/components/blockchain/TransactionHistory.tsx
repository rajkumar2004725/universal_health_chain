import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Paper,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSnackbar } from 'notistack';
import blockchainService from '../../services/blockchain.service';

interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    gasUsed: string;
    timestamp: number;
    status: 'success' | 'failed' | 'pending';
    type: 'health_record' | 'clinical_trial' | 'consent' | 'transfer';
}

const TransactionHistory: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const address = await blockchainService.getCurrentAddress();
                if (!address) return;

                // In a real app, you would fetch transactions from your backend or blockchain
                // This is just mock data for demonstration
                const mockTransactions: Transaction[] = [
                    {
                        hash: '0x1234...5678',
                        from: address,
                        to: '0xabcd...efgh',
                        value: '0.1',
                        gasUsed: '21000',
                        timestamp: Date.now(),
                        status: 'success',
                        type: 'health_record',
                    },
                    // Add more mock transactions here
                ];

                setTransactions(mockTransactions);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                enqueueSnackbar('Error fetching transactions', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [enqueueSnackbar]);

    const handleCopyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        enqueueSnackbar('Address copied to clipboard', { variant: 'success' });
    };

    const openInExplorer = (hash: string) => {
        const explorerUrl = process.env.REACT_APP_BLOCK_EXPLORER_URL;
        if (explorerUrl) {
            window.open(`${explorerUrl}/tx/${hash}`, '_blank');
        }
    };

    const shortenAddress = (address: string) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const getTransactionTypeLabel = (type: Transaction['type']) => {
        switch (type) {
            case 'health_record':
                return 'Health Record';
            case 'clinical_trial':
                return 'Clinical Trial';
            case 'consent':
                return 'Consent';
            case 'transfer':
                return 'Transfer';
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Transaction History
                </Typography>

                <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Hash</TableCell>
                                <TableCell>From</TableCell>
                                <TableCell>To</TableCell>
                                <TableCell align="right">Value (ETH)</TableCell>
                                <TableCell align="right">Gas Used</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx.hash} hover>
                                    <TableCell>
                                        <Chip
                                            label={getTransactionTypeLabel(tx.type)}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {shortenAddress(tx.hash)}
                                            <Tooltip title="Copy Hash">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleCopyAddress(tx.hash)}
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={tx.from}>
                                            <span>{shortenAddress(tx.from)}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={tx.to}>
                                            <span>{shortenAddress(tx.to)}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="right">{tx.value}</TableCell>
                                    <TableCell align="right">{tx.gasUsed}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tx.status}
                                            size="small"
                                            color={
                                                tx.status === 'success'
                                                    ? 'success'
                                                    : tx.status === 'pending'
                                                    ? 'warning'
                                                    : 'error'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View in Explorer">
                                            <IconButton
                                                size="small"
                                                onClick={() => openInExplorer(tx.hash)}
                                            >
                                                <OpenInNewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default TransactionHistory;
