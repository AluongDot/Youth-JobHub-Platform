import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../services/api";
import Loader from "../components/Loader";

function EmployerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [showApplications, setShowApplications] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplicants: 0,
    activeJobs: 0
  });

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      setUser(userData);
      
      // Verify user is employer
      if (userData.role !== 'employer') {
        navigate("/dashboard");
        return;
      }
      
      // Fetch job postings
      fetchJobPostings(userData);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchJobPostings = async (userData) => {
    try {
      setLoading(true);
      // Fetch all jobs and filter by current user
      const { jobs } = await api.getJobs({ limit: 100 });
      
      // Normalize comparison to use `user.id` (Auth returns `user.id`) and job.postedBy may be ObjectId or string
      const userId = userData?.id || userData?._id;
      const userJobs = jobs.filter(job => {
        const postedBy = job.postedBy;
        if (!postedBy) return false;
        
        // Handle different formats of postedBy
        if (typeof postedBy === 'string') {
          return postedBy === userId;
        } else if (postedBy._id) {
          return postedBy._id === userId;
        } else if (postedBy.toString) {
          return postedBy.toString() === userId;
        }
        return false;
      });
      
      setJobPostings(userJobs);
      
      // Calculate stats
      calculateStats(userJobs);
    } catch (err) {
      console.error("Error fetching job postings:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (jobs) => {
    const totalJobs = jobs.length;
    const totalApplicants = jobs.reduce((total, job) => total + (job.applications || 0), 0);
    const activeJobs = jobs.filter(job => job.applications > 0).length;
    
    setStats({
      totalJobs,
      totalApplicants,
      activeJobs
    });
  };

  const fetchApplicationsForJob = async (jobId) => {
    try {
      setLoading(true);
      console.log('🟡 [FRONTEND] Fetching applications for job:', jobId);
      
      // Try different possible API endpoints based on your backend
      let apps;
      try {
        apps = await api.getApplicationsByJob(jobId);
      } catch (err) {
        console.log('Trying alternative API method...');
        // If the above fails, try getting all applications and filtering
        const allApps = await api.getApplications();
        apps = allApps.filter(app => app.job === jobId || app.jobId === jobId || app.job?._id === jobId);
      }
      
      console.log('✅ [FRONTEND] Applications received:', apps);
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (err) {
      console.error("❌ [FRONTEND] Error fetching applications:", err);
      alert("Failed to fetch applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplications = async (job) => {
    setSelectedJob(job);
    setShowApplications(true);
    await fetchApplicationsForJob(job._id || job.id);
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    try {
      console.log('🟡 [FRONTEND] Updating application status:', { appId, newStatus });
      await api.updateApplicationStatus(appId, newStatus);
      
      // Refresh applications to show updated status
      if (selectedJob) {
        await fetchApplicationsForJob(selectedJob._id || selectedJob.id);
      }
      
      // Refresh job counts
      if (user) {
        await fetchJobPostings(user);
      }
      
      alert("Application status updated successfully");
    } catch (err) {
      console.error("❌ [FRONTEND] Error updating application status:", err);
      alert("Failed to update application status");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job posting? This will also delete all applications for this job.")) {
      try {
        await api.deleteJob(jobId);
        setJobPostings(jobPostings.filter(j => j._id !== jobId && j.id !== jobId));
        alert("Job deleted successfully");
        
        // If we're viewing applications for this job, go back to jobs list
        if (selectedJob && (selectedJob._id === jobId || selectedJob.id === jobId)) {
          setShowApplications(false);
          setSelectedJob(null);
          setApplications([]);
        }
      } catch (err) {
        console.error("Error deleting job:", err);
        alert("Failed to delete job");
      }
    }
  };

  const handleViewDocuments = (application) => {
    if (!application.documents || application.documents.length === 0) {
      alert("No documents uploaded for this application");
      return;
    }
    
    // Open documents in new tab
    application.documents.forEach(doc => {
      const documentUrl = doc.url.startsWith('http') ? doc.url : `http://localhost:5000${doc.url}`;
      window.open(documentUrl, '_blank');
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      applied: { color: 'bg-gray-100 text-gray-800', label: 'Applied' },
      reviewing: { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      hired: { color: 'bg-green-100 text-green-800', label: 'Hired' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.applied;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!user) return <Loader fullScreen size="large" />;
  if (loading && !showApplications) return <Loader fullScreen size="large" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employer Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.name || user.email}!
            </p>
          </div>
          <div className="space-x-4">
            <Link
              to="/post-job"
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition inline-block"
            >
              Post New Job
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {showApplications && selectedJob ? (
          // Applications View
          <div>
            <button
              onClick={() => {
                setShowApplications(false);
                setSelectedJob(null);
                setApplications([]);
              }}
              className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Jobs
            </button>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">{selectedJob.title}</h2>
              <p className="text-gray-600">{selectedJob.company} • {selectedJob.location}</p>
              <div className="flex items-center space-x-6 mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{applications.length}</span> Application{applications.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-600">
                  Posted: <span className="font-semibold">{formatDate(selectedJob.createdAt)}</span>
                </p>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Loader size="medium" />
                <p className="mt-4 text-gray-600">Loading applications...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {applications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">No applications yet</p>
                    <p className="text-sm">Applications will appear here when job seekers apply for this position.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applicant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Documents
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cover Letter
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applied On
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((app) => (
                          <tr key={app._id || app.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                  {app.applicant?.name?.charAt(0)?.toUpperCase() || 
                                   app.jobSeeker?.name?.charAt(0)?.toUpperCase() || 
                                   'A'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {app.applicant?.name || app.jobSeeker?.name || "Anonymous Applicant"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {app.applicant?.profile?.title || app.jobSeeker?.profile?.title || "Job Seeker"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {app.applicant?.email || app.jobSeeker?.email || "N/A"}
                              </div>
                              {(app.applicant?.profile?.phone || app.jobSeeker?.profile?.phone) && (
                                <div className="text-sm text-gray-500">
                                  {app.applicant?.profile?.phone || app.jobSeeker?.profile?.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {app.documents && app.documents.length > 0 ? (
                                <button
                                  onClick={() => handleViewDocuments(app)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  View ({app.documents.length})
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500">No documents</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-xs line-clamp-2">
                                {app.coverLetter || "No cover letter provided"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(app.createdAt || app.appliedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(app.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateApplicationStatus(app._id || app.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="applied">Applied</option>
                                <option value="reviewing">Under Review</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Jobs View
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-600">Total Jobs</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalJobs}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-600">Total Applicants</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.totalApplicants}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-600">Active Jobs</h3>
                <p className="text-3xl font-bold text-green-600">{stats.activeJobs}</p>
              </div>
            </div>

            {/* Job Postings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Your Job Postings</h2>
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {jobPostings.length} job{jobPostings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {jobPostings.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                  <p className="text-gray-600 mb-4">You haven't posted any jobs yet</p>
                  <Link
                    to="/post-job"
                    className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition inline-block"
                  >
                    Post Your First Job
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {jobPostings.map((job) => (
                    <div key={job._id || job.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <p className="text-gray-600 mb-2">{job.company} • {job.location}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Posted: {formatDate(job.createdAt)}</span>
                            <span>•</span>
                            <span>Type: {job.type}</span>
                            {job.salary && (
                              <>
                                <span>•</span>
                                <span>Salary: ${job.salary.toLocaleString()}/year</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-blue-600">
                            {job.applications || 0}
                          </div>
                          <p className="text-sm text-gray-600">Applicant{(job.applications || 0) !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewApplications(job)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Applications ({job.applications || 0})
                        </button>
                        <Link
                          to={`/jobs/${job._id || job.id}`}
                          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View Job
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job._id || job.id)}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EmployerDashboard;