export const validateHealthRecord = (data, recordType) => {
    switch (recordType) {
        case 'DIAGNOSIS':
            return validateDiagnosis(data);
        case 'PRESCRIPTION':
            return validatePrescription(data);
        case 'LAB_RESULT':
            return validateLabResult(data);
        case 'VACCINATION':
            return validateVaccination(data);
        case 'SURGERY':
            return validateSurgery(data);
        default:
            return validateGenericRecord(data);
    }
};

function validateDiagnosis(data) {
    const required = ['condition', 'symptoms', 'diagnosis', 'date'];
    return validateRequired(data, required);
}

function validatePrescription(data) {
    const required = ['medications', 'dosage', 'frequency', 'duration', 'date'];
    return validateRequired(data, required);
}

function validateLabResult(data) {
    const required = ['testName', 'result', 'normalRange', 'date'];
    return validateRequired(data, required);
}

function validateVaccination(data) {
    const required = ['vaccine', 'dose', 'date', 'nextDueDate'];
    return validateRequired(data, required);
}

function validateSurgery(data) {
    const required = ['procedure', 'surgeon', 'date', 'notes'];
    return validateRequired(data, required);
}

function validateGenericRecord(data) {
    const required = ['title', 'description', 'date'];
    return validateRequired(data, required);
}

function validateRequired(data, required) {
    for (const field of required) {
        if (!data[field]) {
            return `Missing required field: ${field}`;
        }
    }
    return null;
}
