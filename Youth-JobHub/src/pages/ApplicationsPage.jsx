import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import Loader from '../components/Loader';

const ApplicationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams(); // If you need to apply for a specific job
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (user.role !== 'employer') return navigate('/dashboard');
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { jobs } = await api.getJobs({ limit: 200 });

      const myJobs = jobs.filter(j => 
        j.postedBy === user?._id ||
        j.postedBy?.toString?.() === user?._id?.toString()
      );

      const allApps = [];
      for (const job of myJobs) {
        try {
          const apps = await api.getApplicationsByJob(job.id);
          (apps || []).forEach(a => allApps.push({ ...a, job }));
        } catch (err) {
          console.error('Failed fetching apps for job', job.id, err);
        }
      }

      setApplications(allApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced applyForJob function
  const handleApply = async (jobId, formData) => {
    try {
      setLoading(true);
      setError('');
      
      // Create FormData object
      const submitData = new FormData();
      
      // Append cover letter (ensure it exists)
      submitData.append('coverLetter', formData.coverLetter || `I'm excited to apply for this position.`);
      
      // Append files if they exist
      if (formData.documents && formData.documents.length > 0) {
        formData.documents.forEach(file => {
          submitData.append('documents', file);
        });
      }

      console.log('🟡 [FRONTEND] Submitting application...', {
        jobId: jobId,
        filesCount: formData.documents?.length || 0,
        hasCoverLetter: !!formData.coverLetter
      });

      // Call the API - FIXED: Make sure this matches your API service
      const response = await api.applyForJob(jobId, submitData);
      
      console.log('✅ [FRONTEND] Application submitted successfully:', response);
      
      // Redirect to success page
      navigate('/application-success', { 
        state: { 
          application: response.application,
          jobTitle: response.application?.job?.title || 'the position'
        } 
      });
      
    } catch (error) {
      console.error('❌ [FRONTEND] Application failed:', error);
      
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Example usage of handleApply (you can call this from a job application form)
  const handleExampleApplication = async (job) => {
    const formData = {
      coverLetter: "I am very interested in this position and believe my skills are a great match...",
      documents: [] // You would get these from a file input
    };
    
    await handleApply(job.id, formData);
  };

  const handleStatusChange = async (appId, status) => {
    try {
      await api.updateApplicationStatus(appId, status);
      await fetchApplications();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  const handleFileUpload = async (appId, files) => {
    if (!files || files.length === 0) return;
    setUploadingId(appId);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i]);
      }

      await api.uploadApplicationDocuments(appId, formData);
      await fetchApplications();

      alert('Documents uploaded successfully!');
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload documents');
    } finally {
      setUploadingId(null);
    }
  };

  const handleViewDocument = (documentUrl) => {
    // Use the correct base URL for your environment
    const baseUrl = import.meta.env.DEV ? 'http://localhost:5000' : 'https://your-production-url.com';
    window.open(`${baseUrl}${documentUrl}`, '_blank');
  };

  const handleDeleteDocument = async (appId, docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.deleteDocument(appId, docId);
        await fetchApplications();
      } catch (err) {
        console.error('Delete failed', err);
        alert('Failed to delete document');
      }
    }
  };

  // ADD: Function to withdraw application
  const handleWithdrawApplication = async (appId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        await api.withdrawApplication(appId);
        await fetchApplications();
        alert('Application withdrawn successfully');
      } catch (err) {
        console.error('Withdraw failed', err);
        alert('Failed to withdraw application');
      }
    }
  };

  if (loading) return <Loader text="Loading applications..." />;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>
        <div className="flex gap-4">
          <Link to="/post-job" className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Post New Job
          </Link>
          <Link to="/jobs" className="text-sm bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            Browse Jobs
          </Link>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-500 mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-4">Applications for your jobs will appear here.</p>
          <Link 
            to="/post-job" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">
              Total Applications: <span className="text-blue-600">{applications.length}</span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Details
                  </th>
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map(app => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{app.job?.title}</div>
                      <div className="text-sm text-gray-600">{app.job?.company}</div>
                      <div className="text-xs text-gray-500">{app.job?.location}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {app.applicant?.name || 'Anonymous'}
                      </div>
                      {app.applicant?.profile?.title && (
                        <div className="text-sm text-gray-600">{app.applicant.profile.title}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.applicant?.email || 'N/A'}</div>
                      {app.applicant?.profile?.phone && (
                        <div className="text-sm text-gray-600">{app.applicant.profile.phone}</div>
                      )}
                    </td>

                    {/* Documents Section */}
                    <td className="px-6 py-4">
                      <div className="space-y-2 max-w-xs">
                        {app.documents?.length > 0 ? (
                          app.documents.map(doc => (
                            <div key={doc._id} className="flex items-center justify-between group">
                              <button
                                onClick={() => handleViewDocument(doc.url)}
                                className="text-blue-600 hover:text-blue-800 truncate text-left flex-1"
                                title={`${doc.name} (${(doc.size / 1024).toFixed(1)}KB)`}
                              >
                                <span className="inline-block mr-1">📎</span>
                                <span className="truncate">{doc.name}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteDocument(app._id, doc._id)}
                                className="text-red-500 hover:text-red-700 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete document"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No documents</span>
                        )}

                        {/* Upload New Documents */}
                        <label
                          className={`px-3 py-1 bg-blue-600 text-white rounded cursor-pointer text-xs inline-block transition-colors ${
                            uploadingId === app._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                          }`}
                        >
                          {uploadingId === app._id ? 'Uploading...' : 'Add Documents'}
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={e => handleFileUpload(app._id, e.target.files)}
                            disabled={uploadingId === app._id}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                          />
                        </label>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${app.status === 'hired' ? 'bg-green-100 text-green-800' : ''}
                        ${app.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                        ${app.status === 'reviewing' ? 'bg-blue-100 text-blue-800' : ''}
                        ${app.status === 'applied' ? 'bg-gray-100 text-gray-800' : ''}`}>
                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <select
                          value={app.status}
                          onChange={e => handleStatusChange(app._id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="applied">Applied</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        
                        <button
                          onClick={() => handleWithdrawApplication(app._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;