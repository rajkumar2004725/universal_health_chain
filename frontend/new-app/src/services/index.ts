export { default as authService } from './auth.service';
export { default as healthRecordsService } from './health-records.service';
export { default as clinicalTrialsService } from './clinical-trials.service';

// Re-export interfaces
export type { HealthRecord, CreateHealthRecordDTO } from './health-records.service';
export type { ClinicalTrial, CreateClinicalTrialDTO, TrialApplication } from './clinical-trials.service';
