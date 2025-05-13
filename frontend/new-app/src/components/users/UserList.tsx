import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { Edit, Delete, Search } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: 'active' | 'inactive';
}

const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { enqueueSnackbar } = useSnackbar();

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users', {
                params: { search: searchQuery }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            enqueueSnackbar('Error fetching users', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [searchQuery]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEdit = (userId: string) => {
        // Navigate to edit user page
        window.location.href = `/users/${userId}/edit`;
    };

    const handleDelete = async () => {
        if (!selectedUserId) return;

        try {
            await api.delete(`/users/${selectedUserId}`);
            enqueueSnackbar('User deleted successfully', { variant: 'success' });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            enqueueSnackbar('Error deleting user', { variant: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setSelectedUserId(null);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Box>
            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">User Management</Typography>
                <TextField
                    size="small"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: <Search color="action" />
                    }}
                />
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                backgroundColor:
                                                    user.status === 'active'
                                                        ? 'success.light'
                                                        : 'error.light',
                                                color: 'white',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1,
                                                display: 'inline-block',
                                            }}
                                        >
                                            {user.status}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit user">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(user.id)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete user">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedUserId(user.id);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={users.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>

            <ConfirmationDialog
                open={deleteDialogOpen}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => {
                    setDeleteDialogOpen(false);
                    setSelectedUserId(null);
                }}
            />
        </Box>
    );
};

export default UserList;
