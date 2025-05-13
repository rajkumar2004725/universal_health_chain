import React from 'react';
import { Chip, ChipProps } from '@mui/material';

type Status =
    | 'active'
    | 'inactive'
    | 'pending'
    | 'completed'
    | 'cancelled'
    | 'error'
    | 'warning'
    | 'success';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
    status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
    const getStatusColor = (status: Status): ChipProps['color'] => {
        switch (status) {
            case 'active':
            case 'success':
                return 'success';
            case 'inactive':
            case 'cancelled':
                return 'default';
            case 'pending':
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            case 'completed':
                return 'primary';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: Status): string => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <Chip
            {...props}
            label={getStatusLabel(status)}
            color={getStatusColor(status)}
            size="small"
            sx={{
                fontWeight: 500,
                ...props.sx,
            }}
        />
    );
};

export default StatusBadge;
