import api from './api';

export type TrialStatus = 'RECRUITING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';

export interface ClinicalTrial {
    id: string;
    title: string;
    description: string;
    status: TrialStatus;
    startDate: string;
    endDate: string;
    location: string;
    participants: {
        current: number;
        required: number;
        list: string[];
    };
    criteria: string[];
    compensation: number;
    sponsoredBy: string;
    phase: number;
    conditions: string[];
    blockchainAddress?: string;
    analytics?: {
        enrollmentRate: number;
        completionRate: number;
        adverseEvents: number;
        dataQualityScore: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateClinicalTrialDTO {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    participants: {
        required: number;
    };
    criteria: string[];
    compensation: number;
    sponsoredBy: string;
    phase: number;
    conditions: string[];
    blockchainAddress?: string;
}

export interface TrialApplication {
    id: string;
    trialId: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
    personalInfo: {
        phoneNumber: string;
        emergencyContact: string;
        address: string;
        blockchainAddress?: string;
    };
    medicalHistory: {
        currentMedications: string;
        previousConditions: string;
        allergies: string;
        consentHash?: string;
    };
    data?: {
        measurements: Record<string, any>[];
        observations: Record<string, any>[];
        adverseEvents: Record<string, any>[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface TrialDataSubmission {
    participantId: string;
    data: {
        measurements?: Record<string, any>[];
        observations?: Record<string, any>[];
        adverseEvents?: Record<string, any>[];
    };
    metadata?: Record<string, any>;
}

class ClinicalTrialsService {
    async getAll() {
        const response = await api.get('/clinical-trials');
        return response.data;
    }

    async getById(id: string) {
        const response = await api.get(`/clinical-trials/${id}`);
        return response.data;
    }

    async create(data: CreateClinicalTrialDTO) {
        const response = await api.post('/clinical-trials', data);
        return response.data;
    }

    async update(id: string, data: Partial<CreateClinicalTrialDTO>) {
        const response = await api.put(`/clinical-trials/${id}`, data);
        return response.data;
    }

    async delete(id: string) {
        const response = await api.delete(`/clinical-trials/${id}`);
        return response.data;
    }

    async apply(trialId: string, application: {
        personalInfo: TrialApplication['personalInfo'];
        medicalHistory: TrialApplication['medicalHistory'];
    }) {
        const response = await api.post(`/clinical-trials/${trialId}/apply`, application);
        return response.data;
    }

    async withdrawApplication(trialId: string) {
        const response = await api.post(`/clinical-trials/${trialId}/withdraw`);
        return response.data;
    }

    async getUserApplications() {
        const response = await api.get('/clinical-trials/applications');
        return response.data;
    }

    async getTrialApplications(trialId: string) {
        const response = await api.get(`/clinical-trials/${trialId}/applications`);
        return response.data;
    }

    async updateApplicationStatus(trialId: string, applicationId: string, status: TrialApplication['status']) {
        const response = await api.put(`/clinical-trials/${trialId}/applications/${applicationId}`, { status });
        return response.data;
    }

    async getTrialsByCondition(condition: string) {
        const response = await api.get(`/clinical-trials/condition/${condition}`);
        return response.data;
    }

    async getTrialsByLocation(location: string) {
        const response = await api.get(`/clinical-trials/location/${location}`);
        return response.data;
    }

    // New endpoints for trial data and analytics
    async submitTrialData(trialId: string, data: TrialDataSubmission) {
        const response = await api.post(`/clinical-trials/${trialId}/data`, data);
        return response.data;
    }

    async getTrialAnalytics(trialId: string) {
        const response = await api.get(`/clinical-trials/${trialId}/analytics`);
        return response.data;
    }

    async getParticipantData(trialId: string, participantId: string) {
        const response = await api.get(`/clinical-trials/${trialId}/participants/${participantId}`);
        return response.data;
    }

    // Blockchain verification
    async verifyBlockchainConsent(trialId: string, participantId: string, consentHash: string) {
        const response = await api.post(`/clinical-trials/${trialId}/verify-consent`, {
            participantId,
            consentHash
        });
        return response.data;
    }
}

export default new ClinicalTrialsService();
