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
} from '@mui/material';
import { login } from '../../store/slices/authSlice';
import { RootState } from '../../store';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const formik = useFormik({
        initialValues: {
            username: '',
            password: ''
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(3, 'Username must be at least 3 characters')
                .required('Username is required'),
            password: Yup.string()
                .min(6, 'Password must be at least 6 characters')
                .required('Password is required'),
        }),
        onSubmit: async (values) => {
            try {
                const { username, password } = values;
                console.log('Submitting login form:', { username });
                
                // Dispatch login action
                const result = await dispatch(login({ username, password }) as any);
                console.log('Login dispatch result:', result);
                
                if (result.error) {
                    // Handle Redux error state
                    const errorMessage = result.error.message || 'Login failed. Please try again.';
                    console.error('Login failed:', errorMessage);
                    return;
                }
                
                if (result.payload?.token) {
                    console.log('Login successful, navigating to dashboard');
                    navigate('/dashboard');
                } else {
                    const errorMessage = 'Login failed - no token received';
                    console.error(errorMessage);
                }
            } catch (error: any) {
                const errorMessage = error?.message || 'An unexpected error occurred';
                console.error('Login error:', errorMessage);
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
                        Sign In
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
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component={RouterLink}
                                to="/register"
                                variant="body2"
                                sx={{ textDecoration: 'none' }}
                            >
                                Don't have an account? Sign Up
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
