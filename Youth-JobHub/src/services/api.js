import axios from "axios";

// Base URL
const BASE_URL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_BASE_URL || "https://youth-jobhub-platform.onrender.com/api");

console.log("🟡 [API] Base URL:", BASE_URL);
console.log("🟡 [API] Environment:", import.meta.env.MODE);

// Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, config.params || "");
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - OK`);
    return response;
  },
  (error) => {
    const err = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    };

    console.error("❌ [API] Response error:", err);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Normalize job
const normalizeJob = (job) => ({
  id: job._id || job.id,
  ...job,
});

// ------------------- AUTH -------------------
export const login = async (data) => (await apiClient.post("/auth/login", data)).data;
export const register = async (data) => (await apiClient.post("/auth/register", data)).data;
export const getCurrentUser = async () => (await apiClient.get("/auth/me")).data;
export const logout = async () => (await apiClient.post("/auth/logout")).data;

export const requestPasswordReset = async (email) =>
  (await apiClient.post("/auth/forgot-password", { email })).data;

export const resetPassword = async (token, password) =>
  (await apiClient.post(`/auth/reset-password/${token}`, { password })).data;

// ------------------- JOBS -------------------
export const getJobs = async (params = {}) => {
  const res = await apiClient.get("/jobs", { params });
  const data = res.data;
  return {
    jobs: (data.data || data.jobs || data).map(normalizeJob),
    meta: data.meta || {},
  };
};

export const getJob = async (id) => normalizeJob((await apiClient.get(`/jobs/${id}`)).data);

export const createJob = async (data) => normalizeJob((await apiClient.post("/jobs", data)).data);
export const updateJob = async (id, data) => normalizeJob((await apiClient.put(`/jobs/${id}`, data)).data);
export const deleteJob = async (id) => (await apiClient.delete(`/jobs/${id}`)).data;

// ------------------- APPLICATIONS -------------------
// FIXED: Corrected endpoint structure for consistency
export const applyForJob = async (jobId, formData) => {
  const response = await apiClient.post(`/applications/${jobId}/apply`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// FIXED: Changed to PUT to match backend and corrected endpoint
export const updateApplicationStatus = async (appId, status) =>
  (await apiClient.put(`/applications/${appId}/status`, { status })).data;

export const getUserApplications = async () =>
  (await apiClient.get("/applications/my-applications")).data.applications;

export const getApplicationsByJob = async (jobId) =>
  (await apiClient.get(`/applications/job/${jobId}`)).data.applications;

export const uploadApplicationDocuments = async (appId, formData) =>
  (await apiClient.post(`/applications/${appId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data;

export const deleteDocument = async (appId, docId) =>
  (await apiClient.delete(`/applications/${appId}/documents/${docId}`)).data;

// ------------------- TEST -------------------
export const testApiConnection = async () =>
  (await apiClient.get("/test")).data;

// Default export (clean)
export default {
  login,
  register,
  getCurrentUser,
  logout,

  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,

  applyForJob,
  getUserApplications,
  getApplicationsByJob,
  updateApplicationStatus,
  uploadApplicationDocuments,
  deleteDocument,

  requestPasswordReset,
  resetPassword,
  testApiConnection,

  apiClient,
};

export { apiClient };