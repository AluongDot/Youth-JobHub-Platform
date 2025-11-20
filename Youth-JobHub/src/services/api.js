import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with better error handling
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - Success`);
    return response;
  },
  (error) => {
    console.error('❌ [API] Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      code: error.code
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper to normalize job object from backend (_id -> id)
const normalizeJob = (job) => ({
  id: job._id || job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  type: job.type,
  salary: job.salary,
  description: job.description,
  requirements: job.requirements,
  featuredImage: job.featuredImage,
  createdAt: job.createdAt || job.datePosted,
  applications: job.applications || 0,
  ...job,
});

// Auth API functions
export const requestPasswordReset = async (email) => {
  const res = await apiClient.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (token, password) => {
  const res = await apiClient.post(`/auth/reset-password/${token}`, { password });
  return res.data;
};

export const login = async (credentials) => {
  const res = await apiClient.post('/auth/login', credentials);
  return res.data;
};

export const register = async (userData) => {
  const res = await apiClient.post('/auth/register', userData);
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

// Jobs API
export const getJobs = async (params = {}) => {
  const res = await apiClient.get('/jobs', { params });
  const data = res.data;
  const jobs = (data.data || data.jobs || []).map(normalizeJob);
  const meta = data.meta || {};
  return { jobs, meta };
};

export const getJob = async (id) => {
  const res = await apiClient.get(`/jobs/${id}`);
  return normalizeJob(res.data);
};

export const createJob = async (jobData) => {
  const res = await apiClient.post('/jobs', jobData);
  return normalizeJob(res.data);
};

export const updateJob = async (id, jobData) => {
  const res = await apiClient.put(`/jobs/${id}`, jobData);
  return normalizeJob(res.data);
};

export const deleteJob = async (id) => {
  const res = await apiClient.delete(`/jobs/${id}`);
  return res.data;
};

// Applications API
export const applyForJob = async (jobId, applicationData) => {
  try {
    console.log('🟡 [API] Applying for job:', jobId);
    const res = await apiClient.post(`/applications/apply/${jobId}`, applicationData);
    console.log('✅ [API] Application successful:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Application failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const applyForJobWithDocuments = async (jobId, formData) => {
  try {
    console.log('🟡 [API] Applying for job with documents:', jobId);
    const res = await apiClient.post(`/applications/${jobId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ [API] Application with documents successful:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Application with documents failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const getUserApplications = async () => {
  try {
    const res = await apiClient.get('/applications/my-applications');
    return res.data.applications || res.data.data || [];
  } catch (error) {
    console.error('❌ [API] Get user applications failed:', error);
    throw error;
  }
};

export const getMyApplications = async () => {
  const res = await apiClient.get('/applications/my-applications');
  return res.data.data || [];
};

export const getApplicationsByJob = async (jobId) => {
  const res = await apiClient.get(`/applications/job/${jobId}`);
  return res.data.data || [];
};

export const updateApplicationStatus = async (applicationId, status) => {
  const res = await apiClient.put(`/applications/${applicationId}/status`, { status });
  return res.data;
};

export const uploadApplicationDocuments = async (applicationId, formData) => {
  const res = await apiClient.post(`/applications/${applicationId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const deleteDocument = async (applicationId, documentId) => {
  const res = await apiClient.delete(`/applications/${applicationId}/documents/${documentId}`);
  return res.data;
};

// User API
export const updateProfile = async (userData) => {
  const res = await apiClient.put('/users/profile', userData);
  return res.data;
};

// Export all functions
export default {
  // Auth
  requestPasswordReset,
  resetPassword,
  login,
  register,
  getCurrentUser,
  
  // Jobs
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  
  // Applications
  applyForJob,
  applyForJobWithDocuments,
  getUserApplications,
  getMyApplications,
  getApplicationsByJob,
  updateApplicationStatus,
  uploadApplicationDocuments,
  deleteDocument,
  
  // User
  updateProfile,
  
  // Client
  apiClient
};

export { apiClient };