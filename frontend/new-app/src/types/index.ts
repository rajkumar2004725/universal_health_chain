export interface User {
    id: string;
    username: string;
    email: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'HEALTHCARE_PROVIDER';
    profile?: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        address?: string;
        dateOfBirth?: string;
        gender?: string;
    };
    professionalInfo?: {
        specialization?: string;
        license?: string;
        experience?: number;
        hospital?: string;
    };
}

export interface HealthRecord {
    id: string;
    patientId: string;
    doctorId: string;
    recordType: 'DIAGNOSIS' | 'PRESCRIPTION' | 'LAB_RESULT' | 'VACCINATION' | 'SURGERY' | 'OTHER';
    data: {
        title: string;
        description: string;
        date: string;
        attachments?: string[];
        metadata?: Record<string, any>;
    };
    createdAt: string;
    updatedAt: string;
    accessList: string[];
}

export interface ClinicalTrial {
    id: string;
    title: string;
    description: string;
    criteria: string[];
    compensation: number;
    startDate: string;
    endDate: string;
    status: 'RECRUITING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
    participants: {
        userId: string;
        status: 'APPLIED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
        joinedAt: string;
    }[];
    researcherId: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    error?: string;
}
