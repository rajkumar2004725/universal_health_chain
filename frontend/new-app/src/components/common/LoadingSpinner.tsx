import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
            }}
        >
            <CircularProgress size={40} />
            <Typography
                variant="body1"
                sx={{ mt: 2, color: 'text.secondary' }}
            >
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingSpinner;
