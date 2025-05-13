import axios, { AxiosInstance } from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'HEALTHCARE_PROVIDER';
  profile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    address?: string;
  };
}

interface HealthRecordData {
  patientId: string;
  recordType: 'DIAGNOSIS' | 'PRESCRIPTION' | 'LAB_RESULT' | 'VACCINATION' | 'SURGERY' | 'OTHER';
  data: {
    title: string;
    description: string;
    date: string;
    provider: string;
    status: string;
    attachments?: string[];
  };
}

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;

  private constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Authentication
  async login(credentials: LoginCredentials) {
    return this.api.post('/auth/login', credentials);
  }

  async register(userData: RegisterData) {
    return this.api.post('/auth/register', userData);
  }

  async getCurrentUser() {
    return this.api.get('/auth/me');
  }

  async updateProfile(data: Partial<RegisterData['profile']>) {
    return this.api.put('/auth/profile', { profile: data });
  }

  // Health Records
  async getHealthRecords() {
    return this.api.get('/health-records');
  }

  async getHealthRecord(recordId: string) {
    return this.api.get(`/health-records/${recordId}`);
  }

  async createHealthRecord(data: HealthRecordData) {
    return this.api.post('/health-records', data);
  }

  async updateHealthRecord(recordId: string, data: Partial<HealthRecordData['data']>) {
    return this.api.put(`/health-records/${recordId}`, { data });
  }

  async grantAccess(recordId: string, userId: string) {
    return this.api.post(`/health-records/${recordId}/grant-access`, { userId });
  }

  async revokeAccess(recordId: string, userId: string) {
    return this.api.post(`/health-records/${recordId}/revoke-access`, { userId });
  }

  // Clinical Trials
  async getClinicalTrials() {
    return this.api.get('/clinical-trials');
  }

  async participateInTrial(trialId: string, data: any) {
    return this.api.post(`/clinical-trials/${trialId}/participate`, data);
  }

  // Analytics
  async getAnalytics() {
    return this.api.get('/analytics');
  }
}

export const apiService = ApiService.getInstance();
