import React from 'react';
import { Box } from '@mui/material';
import { PageHeader } from '../components/common';

const Profile: React.FC = () => {
    return (
        <Box>
            <PageHeader 
                title="Profile"
                breadcrumbs={[
                    { text: 'Dashboard', href: '/dashboard' },
                    { text: 'Profile' }
                ]}
            />
            {/* Content will be implemented later */}
        </Box>
    );
};

export default Profile;
