import api from './api';

export interface FHIRResource {
    resourceType: string;
    id?: string;
    meta?: {
        versionId?: string;
        lastUpdated?: string;
    };
    [key: string]: any;
}

export interface HL7Message {
    type: string;
    event: string;
    version: string;
    segments: {
        name: string;
        fields: string[];
    }[];
}

class HealthcareStandardsService {
    // FHIR Methods
    async convertToFHIR(data: any, resourceType: string): Promise<FHIRResource> {
        const response = await api.post('/standards/fhir/convert', {
            data,
            resourceType
        });
        return response.data;
    }

    async getFHIRResource(resourceType: string, id: string): Promise<FHIRResource> {
        const response = await api.get(`/standards/fhir/${resourceType}/${id}`);
        return response.data;
    }

    async searchFHIR(resourceType: string, params: Record<string, string>): Promise<FHIRResource[]> {
        const response = await api.get(`/standards/fhir/${resourceType}`, {
            params
        });
        return response.data;
    }

    async createFHIRResource(resource: FHIRResource): Promise<FHIRResource> {
        const response = await api.post(`/standards/fhir/${resource.resourceType}`, resource);
        return response.data;
    }

    async updateFHIRResource(resource: FHIRResource): Promise<FHIRResource> {
        const response = await api.put(
            `/standards/fhir/${resource.resourceType}/${resource.id}`,
            resource
        );
        return response.data;
    }

    // HL7 Methods
    async convertToHL7(data: any, messageType: string): Promise<HL7Message> {
        const response = await api.post('/standards/hl7/convert', {
            data,
            messageType
        });
        return response.data;
    }

    async parseHL7Message(message: string): Promise<HL7Message> {
        const response = await api.post('/standards/hl7/parse', {
            message
        });
        return response.data;
    }

    async generateHL7Message(data: HL7Message): Promise<string> {
        const response = await api.post('/standards/hl7/generate', data);
        return response.data;
    }

    // Data Transformation
    async transformHealthRecord(record: any, targetFormat: 'FHIR' | 'HL7'): Promise<any> {
        const response = await api.post('/standards/transform', {
            record,
            targetFormat
        });
        return response.data;
    }

    // EHR Integration
    async exportToEHR(data: any, system: 'EPIC' | 'CERNER' | 'ALLSCRIPTS'): Promise<any> {
        const response = await api.post(`/standards/ehr/${system.toLowerCase()}/export`, data);
        return response.data;
    }

    async importFromEHR(
        system: 'EPIC' | 'CERNER' | 'ALLSCRIPTS',
        patientId: string
    ): Promise<any> {
        const response = await api.get(`/standards/ehr/${system.toLowerCase()}/import`, {
            params: { patientId }
        });
        return response.data;
    }

    // Validation
    async validateFHIRResource(resource: FHIRResource): Promise<{
        valid: boolean;
        errors?: string[];
    }> {
        const response = await api.post('/standards/fhir/validate', resource);
        return response.data;
    }

    async validateHL7Message(message: string): Promise<{
        valid: boolean;
        errors?: string[];
    }> {
        const response = await api.post('/standards/hl7/validate', { message });
        return response.data;
    }

    // Terminology Services
    async searchSNOMED(query: string): Promise<any[]> {
        const response = await api.get('/standards/terminology/snomed', {
            params: { query }
        });
        return response.data;
    }

    async searchLOINC(query: string): Promise<any[]> {
        const response = await api.get('/standards/terminology/loinc', {
            params: { query }
        });
        return response.data;
    }

    async searchRxNorm(query: string): Promise<any[]> {
        const response = await api.get('/standards/terminology/rxnorm', {
            params: { query }
        });
        return response.data;
    }
}

export default new HealthcareStandardsService();
