import axios from 'axios';

// Use proxy in development, direct URL in production
const BASE_URL = import.meta.env.DEV 
  ? '/api' // This will use the Vite proxy
  : (import.meta.env.VITE_API_BASE_URL || 'https://youth-jobhub-platform.onrender.com/api');

console.log('🟡 [API] Base URL:', BASE_URL);
console.log('🟡 [API] Environment:', import.meta.env.MODE);

// Create axios instance with better error handling
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // 30 second timeout
  withCredentials: true
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
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
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      data: error.response?.data
    };
    
    console.error('❌ [API] Response error:', errorDetails);

    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your connection and try again.';
    } else if (error.response?.status === 404) {
      error.message = 'API endpoint not found. Please check the server configuration.';
    } else if (error.response?.status === 500) {
      error.message = 'Server error. Please try again later.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your internet connection.';
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      console.log('🔐 [API] Authentication expired');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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
  try {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  } catch (error) {
    console.error('❌ [API] Password reset request failed:', error);
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const res = await apiClient.post(`/auth/reset-password/${token}`, { password });
    return res.data;
  } catch (error) {
    console.error('❌ [API] Password reset failed:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Login failed:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    console.log('🟡 [API] Registering user:', userData);
    const res = await apiClient.post('/auth/register', userData);
    console.log('✅ [API] Registration successful:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Registration failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const res = await apiClient.get('/auth/me');
    return res.data;
  } catch (error) {
    console.error('❌ [API] Get current user failed:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  } catch (error) {
    console.error('❌ [API] Logout failed:', error);
    throw error;
  }
};

// Jobs API
export const getJobs = async (params = {}) => {
  try {
    console.log('🟡 [API] Fetching jobs with params:', params);
    const res = await apiClient.get('/jobs', { params });
    const data = res.data;
    const jobs = (data.data || data.jobs || data || []).map(normalizeJob);
    const meta = data.meta || {};
    console.log(`✅ [API] Retrieved ${jobs.length} jobs`);
    return { jobs, meta };
  } catch (error) {
    console.error('❌ [API] Get jobs failed:', error);
    throw error;
  }
};

export const getJob = async (id) => {
  try {
    const res = await apiClient.get(`/jobs/${id}`);
    return normalizeJob(res.data);
  } catch (error) {
    console.error('❌ [API] Get job failed:', error);
    throw error;
  }
};

export const createJob = async (jobData) => {
  try {
    const res = await apiClient.post('/jobs', jobData);
    return normalizeJob(res.data);
  } catch (error) {
    console.error('❌ [API] Create job failed:', error);
    throw error;
  }
};

export const updateJob = async (id, jobData) => {
  try {
    const res = await apiClient.put(`/jobs/${id}`, jobData);
    return normalizeJob(res.data);
  } catch (error) {
    console.error('❌ [API] Update job failed:', error);
    throw error;
  }
};

export const deleteJob = async (id) => {
  try {
    const res = await apiClient.delete(`/jobs/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Delete job failed:', error);
    throw error;
  }
};

// Applications API functions
export const getApplicationsByJob = async (jobId) => {
  try {
    const res = await apiClient.get(`/applications/job/${jobId}`);
    return res.data.applications || res.data.data || [];
  } catch (error) {
    console.error('❌ [API] Get applications by job failed:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (appId, status) => {
  try {
    const res = await apiClient.patch(`/applications/${appId}/status`, { status });
    return res.data;
  } catch (error) {
    console.error('❌ [API] Update application status failed:', error);
    throw error;
  }
};

export const uploadApplicationDocuments = async (appId, formData) => {
  try {
    const res = await apiClient.post(`/applications/${appId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error('❌ [API] Upload documents failed:', error);
    throw error;
  }
};

export const deleteDocument = async (appId, docId) => {
  try {
    const res = await apiClient.delete(`/applications/${appId}/documents/${docId}`);
    return res.data;
  } catch (error) {
    console.error('❌ [API] Delete document failed:', error);
    throw error;
  }
};

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

export const getUserApplications = async () => {
  try {
    const res = await apiClient.get('/applications/my-applications');
    return res.data.applications || res.data.data || [];
  } catch (error) {
    console.error('❌ [API] Get user applications failed:', error);
    throw error;
  }
};

// Test API connection
export const testApiConnection = async () => {
  try {
    const res = await apiClient.get('/test');
    return res.data;
  } catch (error) {
    console.error('❌ [API] Test connection failed:', error);
    throw error;
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
  logout,
  
  // Jobs
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  
  // Applications
  applyForJob,
  getUserApplications,
  getApplicationsByJob,
  updateApplicationStatus,
  uploadApplicationDocuments,
  deleteDocument,
  
  // Test
  testApiConnection,
  
  // Client
  apiClient
};

export { apiClient };