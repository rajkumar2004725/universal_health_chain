import React from 'react';
import { Box, Typography, Breadcrumbs, Link, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface PageHeaderProps {
    title: string;
    breadcrumbs?: Array<{
        text: string;
        href?: string;
    }>;
    action?: {
        text: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    breadcrumbs = [],
    action,
}) => {
    return (
        <Box sx={{ mb: 4 }}>
            {breadcrumbs.length > 0 && (
                <Breadcrumbs sx={{ mb: 2 }}>
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return crumb.href ? (
                            <Link
                                key={crumb.text}
                                component={RouterLink}
                                to={crumb.href}
                                color={isLast ? 'text.primary' : 'inherit'}
                                sx={{
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: isLast ? 'none' : 'underline',
                                    },
                                }}
                            >
                                {crumb.text}
                            </Link>
                        ) : (
                            <Typography
                                key={crumb.text}
                                color={isLast ? 'text.primary' : 'inherit'}
                            >
                                {crumb.text}
                            </Typography>
                        );
                    })}
                </Breadcrumbs>
            )}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h4" component="h1">
                    {title}
                </Typography>
                {action && (
                    <Button
                        variant="contained"
                        onClick={action.onClick}
                        startIcon={action.icon}
                    >
                        {action.text}
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default PageHeader;
