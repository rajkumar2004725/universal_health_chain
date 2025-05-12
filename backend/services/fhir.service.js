import axios from 'axios';
import config from '../config/config.js';

class FHIRService {
    constructor() {
        this.client = axios.create({
            headers: {
                'Authorization': `Bearer ${config.healthcare.fhirApiKey}`,
                'Content-Type': 'application/fhir+json'
            }
        });
    }

    convertToFHIR(healthRecord) {
        const resource = {
            resourceType: 'Bundle',
            type: 'document',
            entry: []
        };

        switch (healthRecord.recordType) {
            case 'DIAGNOSIS':
                resource.entry.push({
                    resourceType: 'Condition',
                    subject: { reference: `Patient/${healthRecord.patientId}` },
                    code: {
                        text: healthRecord.data.condition
                    },
                    clinicalStatus: {
                        coding: [{
                            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                            code: 'active'
                        }]
                    }
                });
                break;

            case 'PRESCRIPTION':
                resource.entry.push({
                    resourceType: 'MedicationRequest',
                    subject: { reference: `Patient/${healthRecord.patientId}` },
                    medicationCodeableConcept: {
                        text: healthRecord.data.medications
                    },
                    dosageInstruction: [{
                        text: `${healthRecord.data.dosage} - ${healthRecord.data.frequency}`
                    }],
                    dispenseRequest: {
                        validityPeriod: {
                            start: healthRecord.data.date,
                            end: healthRecord.data.duration
                        }
                    }
                });
                break;

            case 'LAB_RESULT':
                resource.entry.push({
                    resourceType: 'Observation',
                    subject: { reference: `Patient/${healthRecord.patientId}` },
                    code: {
                        text: healthRecord.data.testName
                    },
                    valueString: healthRecord.data.result,
                    referenceRange: [{
                        text: healthRecord.data.normalRange
                    }]
                });
                break;

            // Add more mappings for other record types
        }

        return resource;
    }

    async exportToFHIR(healthRecord) {
        try {
            const fhirResource = this.convertToFHIR(healthRecord);
            // In a real implementation, you would send this to a FHIR server
            return fhirResource;
        } catch (error) {
            throw new Error('Failed to export to FHIR: ' + error.message);
        }
    }

    async importFromFHIR(fhirResource) {
        try {
            // Convert FHIR resource to our health record format
            const healthRecord = {
                recordType: this.determineRecordType(fhirResource),
                data: this.extractData(fhirResource)
            };
            return healthRecord;
        } catch (error) {
            throw new Error('Failed to import from FHIR: ' + error.message);
        }
    }

    determineRecordType(fhirResource) {
        switch (fhirResource.resourceType) {
            case 'Condition':
                return 'DIAGNOSIS';
            case 'MedicationRequest':
                return 'PRESCRIPTION';
            case 'Observation':
                return 'LAB_RESULT';
            default:
                return 'OTHER';
        }
    }

    extractData(fhirResource) {
        // Extract relevant data based on resource type
        switch (fhirResource.resourceType) {
            case 'Condition':
                return {
                    condition: fhirResource.code.text,
                    date: fhirResource.onsetDateTime
                };
            case 'MedicationRequest':
                return {
                    medications: fhirResource.medicationCodeableConcept.text,
                    dosage: fhirResource.dosageInstruction[0].text,
                    date: fhirResource.authoredOn
                };
            // Add more cases as needed
            default:
                return fhirResource;
        }
    }
}

export default new FHIRService();
