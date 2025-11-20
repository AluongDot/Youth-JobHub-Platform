import axios from 'axios';

const BASE_URL = import.meta.env.DEV 
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'https://youth-jobhub-platform.onrender.com/api');

console.log('🟡 [API] Base URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
});

// Request interceptor
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

// Response interceptor
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
    }
    
    return Promise.reject(error);
  }
);

// Helper to normalize job object
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

// ==================== AUTH API ====================
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

// ==================== JOBS API ====================
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

// ==================== APPLICATIONS API ====================
// Fix: Add the missing functions that ApplicationsPage needs
export const applyForJob = async (jobId, applicationData = {}) => {
  try {
    console.log('🟡 [API] Applying for job:', jobId);
    
    // Ensure applicationData has required fields
    const payload = {
      coverLetter: applicationData.coverLetter || '',
      resume: applicationData.resume || '',
      ...applicationData
    };

    const res = await apiClient.post(`/applications/apply/${jobId}`, payload);
    console.log('✅ [API] Application successful:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Application failed:', error);
    throw error;
  }
};

// Fix: Add this missing function
export const getApplicationsByJob = async (jobId) => {
  try {
    console.log('🟡 [API] Getting applications for job:', jobId);
    const res = await apiClient.get(`/applications/job/${jobId}`);
    return res.data.data || res.data.applications || [];
  } catch (error) {
    console.error('❌ [API] Get applications by job failed:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

// Fix: Add this missing function
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    console.log('🟡 [API] Updating application status:', applicationId, status);
    const res = await apiClient.put(`/applications/${applicationId}/status`, { status });
    return res.data;
  } catch (error) {
    console.error('❌ [API] Update application status failed:', error);
    throw error;
  }
};

// Fix: Add this missing function
export const uploadApplicationDocuments = async (applicationId, formData) => {
  try {
    console.log('🟡 [API] Uploading documents for application:', applicationId);
    const res = await apiClient.post(`/applications/${applicationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.error('❌ [API] Upload documents failed:', error);
    throw error;
  }
};

// Fix: Add this missing function
export const deleteDocument = async (applicationId, documentId) => {
  try {
    console.log('🟡 [API] Deleting document:', applicationId, documentId);
    const res = await apiClient.delete(`/applications/${applicationId}/documents/${documentId}`);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Delete document failed:', error);
    throw error;
  }
};

export const getUserApplications = async () => {
  try {
    const res = await apiClient.get('/applications/my-applications');
    return res.data.applications || res.data.data || [];
  } catch (error) {
    console.error('❌ [API] Get user applications failed:', error);
    return [];
  }
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
  getApplicationsByJob,
  updateApplicationStatus,
  uploadApplicationDocuments,
  deleteDocument,
  getUserApplications,
  
  // Client
  apiClient
};

export { apiClient };