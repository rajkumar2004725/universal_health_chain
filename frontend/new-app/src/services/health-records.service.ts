import api from './api';

export type RecordType = 'DIAGNOSIS' | 'PRESCRIPTION' | 'LAB_RESULT' | 'VACCINATION' | 'SURGERY' | 'OTHER';

export interface HealthRecord {
    id: string;
    patientId: string;
    doctorId: string;
    recordType: RecordType;
    data: {
        title: string;
        description: string;
        date: string;
        provider: string;
        status: 'active' | 'inactive' | 'pending';
        attachments?: string[];
        metadata?: Record<string, any>;
    };
    blockchainHash?: string;
    accessList: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateHealthRecordDTO {
    patientId: string;
    recordType: RecordType;
    data: {
        title: string;
        description: string;
        date: string;
        provider: string;
        attachments?: string[];
        metadata?: Record<string, any>;
    };
}

class HealthRecordsService {
    async getAll() {
        const response = await api.get('/health-records');
        return response.data;
    }

    async getById(id: string) {
        const response = await api.get(`/health-records/${id}`);
        return response.data;
    }

    async create(data: CreateHealthRecordDTO) {
        const response = await api.post('/health-records', data);
        return response.data;
    }

    async update(id: string, data: Partial<CreateHealthRecordDTO>) {
        const response = await api.put(`/health-records/${id}`, data);
        return response.data;
    }

    async delete(id: string) {
        const response = await api.delete(`/health-records/${id}`);
        return response.data;
    }

    async getByPatient(patientId: string) {
        const response = await api.get(`/health-records/patient/${patientId}`);
        return response.data;
    }

    async getByDoctor(doctorId: string) {
        const response = await api.get(`/health-records/doctor/${doctorId}`);
        return response.data;
    }

    async share(recordId: string, userId: string) {
        try {
            console.log('Health records service: Calling grant-access API', { recordId, userId });
            const response = await api.post(`/health-records/${recordId}/grant-access`, { userId });
            console.log('Health records service: API response', response.data);
            return response.data;
        } catch (error) {
            console.error('Health records service: Error granting access', error);
            throw error;
        }
    }

    async revokeAccess(recordId: string, userId: string) {
        const response = await api.post(`/health-records/${recordId}/revoke-access`, { userId });
        return response.data;
    }

    async getSharedUsers(recordId: string) {
        const response = await api.get(`/health-records/${recordId}/shared-users`);
        return response.data;
    }
}

export default new HealthRecordsService();
