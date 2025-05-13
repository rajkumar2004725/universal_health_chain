import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const AuthRedirect: React.FC = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    
    return isAuthenticated ? (
        <Navigate to="/dashboard" replace />
    ) : (
        <Navigate to="/login" replace />
    );
};

export default AuthRedirect;
