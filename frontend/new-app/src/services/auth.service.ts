import api from './api';
import { User } from '../types';

interface LoginCredentials {
    username: string;
    password: string;
}

interface RegisterData {
    username: string;
    email: string;
    password: string;
    role: User['role'];
    profile?: User['profile'];
    professionalInfo?: User['professionalInfo'];
}

class AuthService {
    async login(credentials: LoginCredentials) {
        try {
            console.log('Attempting login with:', { username: credentials.username });
            const response = await api.post('/auth/login', credentials);
            console.log('Login response:', response.data);
            
            if (!response.data) {
                throw new Error('No data received from server');
            }
            
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                return response.data;
            }
            
            throw new Error('No token received from server');
        } catch (error: any) {
            console.error('Login error:', error.response?.data?.error || error.message);
            if (error.response?.status === 404) {
                throw new Error('Login service is not available');
            }
            throw error.response?.data?.error || error.message || 'Login failed';
        }
    }

    async register(data: RegisterData) {
        try {
            const response = await api.post('/auth/register', data);
            
            if (!response.data) {
                throw new Error('No data received from server');
            }
            
            if (response.data.error) {
                throw new Error(response.data.error);
            }
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            } else {
                throw new Error('No token received from server');
            }
            
            return response.data;
        } catch (error: any) {
            console.error('Register error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    async getCurrentUser() {
        const response = await api.get('/auth/me');
        return response.data;
    }

    async updateProfile(data: Partial<User['profile']>) {
        const response = await api.put('/auth/profile', { profile: data });
        return response.data;
    }

    async updateProfessionalInfo(data: Partial<User['professionalInfo']>) {
        const response = await api.put('/auth/profile', { professionalInfo: data });
        return response.data;
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
}

export default new AuthService();
