import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Link,
    Paper,
    Alert,
    MenuItem,
} from '@mui/material';
import { register } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { User } from '../../types';

const roles: User['role'][] = ['PATIENT', 'DOCTOR', 'HEALTHCARE_PROVIDER'];

const Register: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'PATIENT' as User['role'],
            firstName: '',
            lastName: '',
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(3, 'Username must be at least 3 characters')
                .required('Username is required'),
            email: Yup.string()
                .email('Invalid email address')
                .required('Email is required'),
            password: Yup.string()
                .min(6, 'Password must be at least 6 characters')
                .required('Password is required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords must match')
                .required('Confirm password is required'),
            role: Yup.string()
                .oneOf(roles, 'Invalid role')
                .required('Role is required'),
            firstName: Yup.string().required('First name is required'),
            lastName: Yup.string().required('Last name is required'),
        }),
        onSubmit: async (values) => {
            try {
                const userData = {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                    role: values.role,
                    profile: {
                        firstName: values.firstName,
                        lastName: values.lastName,
                    },
                };
                await dispatch(register(userData) as any);
                navigate('/dashboard');
            } catch (error) {
                console.error('Registration failed:', error);
            }
        },
    });

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 2,
                    }}
                >
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}
                    >
                        Universal Health Chain
                    </Typography>
                    <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
                        Create Account
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={formik.handleSubmit}
                        sx={{ width: '100%' }}
                    >
                        <TextField
                            fullWidth
                            id="username"
                            name="username"
                            label="Username"
                            value={formik.values.username}
                            onChange={formik.handleChange}
                            error={formik.touched.username && Boolean(formik.errors.username)}
                            helperText={formik.touched.username && formik.errors.username}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            id="email"
                            name="email"
                            label="Email Address"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            id="firstName"
                            name="firstName"
                            label="First Name"
                            value={formik.values.firstName}
                            onChange={formik.handleChange}
                            error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                            helperText={formik.touched.firstName && formik.errors.firstName}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            id="lastName"
                            name="lastName"
                            label="Last Name"
                            value={formik.values.lastName}
                            onChange={formik.handleChange}
                            error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                            helperText={formik.touched.lastName && formik.errors.lastName}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            id="role"
                            name="role"
                            select
                            label="Role"
                            value={formik.values.role}
                            onChange={formik.handleChange}
                            error={formik.touched.role && Boolean(formik.errors.role)}
                            helperText={formik.touched.role && formik.errors.role}
                            margin="normal"
                        >
                            {roles.map((role) => (
                                <MenuItem key={role} value={role}>
                                    {role.replace('_', ' ')}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            id="password"
                            name="password"
                            label="Password"
                            type="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            value={formik.values.confirmPassword}
                            onChange={formik.handleChange}
                            error={
                                formik.touched.confirmPassword &&
                                Boolean(formik.errors.confirmPassword)
                            }
                            helperText={
                                formik.touched.confirmPassword && formik.errors.confirmPassword
                            }
                            margin="normal"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component={RouterLink}
                                to="/login"
                                variant="body2"
                                sx={{ textDecoration: 'none' }}
                            >
                                Already have an account? Sign In
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Register;
