import chai from 'chai';
import chaiHttp from 'chai-http';
const { expect } = chai;
import app from '../src/server.js';
import User from '../models/User.js';
import HealthRecord from '../models/HealthRecord.js';
import { generateTestToken } from './setup.js';

chai.use(chaiHttp);

describe('Health Records API', () => {
    let testUser;
    let testToken;

    beforeEach(async () => {
        // Create test user
        testUser = await User.create({
            username: 'testdoctor',
            email: 'doctor@test.com',
            password: 'password123',
            role: 'DOCTOR',
            blockchainAddress: '0x123...',
            status: 'ACTIVE'
        });

        testToken = generateTestToken(testUser._id, 'DOCTOR');
    });

    describe('POST /api/health-records', () => {
        it('should create a new health record', async () => {
            const recordData = {
                patientId: '123',
                recordType: 'DIAGNOSIS',
                data: {
                    condition: 'Flu',
                    symptoms: ['fever', 'cough'],
                    diagnosis: 'Influenza A',
                    date: new Date()
                }
            };

            const res = await chai.request(app)
                .post('/api/health-records')
                .set('Authorization', `Bearer ${testToken}`)
                .send(recordData);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('recordId');
            expect(res.body).to.have.property('blockchain');
        });

        it('should fail with invalid record type', async () => {
            const recordData = {
                patientId: '123',
                recordType: 'INVALID_TYPE',
                data: {}
            };

            const res = await chai.request(app)
                .post('/api/health-records')
                .set('Authorization', `Bearer ${testToken}`)
                .send(recordData);

            expect(res).to.have.status(400);
        });
    });

    describe('GET /api/health-records/:recordId', () => {
        let testRecord;

        beforeEach(async () => {
            testRecord = await HealthRecord.create({
                patientId: '123',
                recordType: 'DIAGNOSIS',
                data: {
                    condition: 'Test Condition'
                },
                metadata: {
                    createdBy: testUser._id,
                    facility: 'Test Hospital'
                },
                accessControl: {
                    allowedUsers: [testUser._id],
                    allowedRoles: ['ADMIN']
                }
            });
        });

        it('should retrieve a health record', async () => {
            const res = await chai.request(app)
                .get(`/api/health-records/${testRecord._id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('data');
            expect(res.body.data).to.have.property('condition');
        });

        it('should fail with invalid record id', async () => {
            const res = await chai.request(app)
                .get('/api/health-records/invalid-id')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res).to.have.status(404);
        });
    });
});
