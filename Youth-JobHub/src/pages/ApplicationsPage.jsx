import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../services/api'
import Loader from '../components/Loader'

const ApplicationsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [error, setError] = useState('')
  const [uploadingId, setUploadingId] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    
    if (user.role !== 'employer') {
      navigate('/dashboard')
      return
    }
    
    fetchApplications()
  }, [user, navigate])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Get jobs posted by this employer
      const { jobs } = await api.getJobs({ limit: 200 })
      const myJobs = jobs.filter(job => {
        return job.postedBy === user?._id || 
               job.postedBy?.toString?.() === user?._id?.toString() ||
               job.userId === user?._id
      })

      // Get applications for each job
      const allApplications = []
      for (const job of myJobs) {
        try {
          const jobApplications = await api.getApplicationsByJob(job.id)
          if (Array.isArray(jobApplications)) {
            jobApplications.forEach(app => {
              allApplications.push({ 
                ...app, 
                job,
                // Ensure we have an id
                id: app._id || app.id
              })
            })
          }
        } catch (err) {
          console.error(`Failed to fetch applications for job ${job.id}:`, err)
        }
      }

      setApplications(allApplications)
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Failed to load applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appId, status) => {
    try {
      await api.updateApplicationStatus(appId, status)
      // Refresh the applications list
      await fetchApplications()
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update application status. Please try again.')
    }
  }

  const handleFileUpload = async (appId, files) => {
    if (!files || files.length === 0) return

    setUploadingId(appId)

    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i])
      }

      await api.uploadApplicationDocuments(appId, formData)
      await fetchApplications() // Refresh to show new documents
      
      alert('Documents uploaded successfully!')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload documents. Please try again.')
    } finally {
      setUploadingId(null)
    }
  }

  const handleViewDocument = (documentUrl) => {
    // Use the full backend URL for documents
    const fullUrl = documentUrl.startsWith('http') 
      ? documentUrl 
      : `https://youth-jobhub-platform.onrender.com${documentUrl}`
    window.open(fullUrl, '_blank')
  }

  const handleDeleteDocument = async (appId, docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.deleteDocument(appId, docId)
        await fetchApplications()
      } catch (err) {
        console.error('Delete failed:', err)
        alert('Failed to delete document. Please try again.')
      }
    }
  }

  if (loading) return <Loader text="Loading applications..." />
  
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Job Applications</h1>
        <Link to="/post-job" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Post New Job
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">No applications received yet.</p>
          <Link to="/post-job" className="text-blue-600 hover:text-blue-800">
            Post your first job to get applications
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job & Applicant
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
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.job?.title}</div>
                      <div className="text-sm text-gray-600">{app.job?.company}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Applicant: {app.applicant?.name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Email: {app.applicant?.email || 'N/A'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {/* Existing Documents */}
                        {(app.documents || []).map(doc => (
                          <div key={doc._id || doc.id} className="flex items-center justify-between text-sm">
                            <button
                              onClick={() => handleViewDocument(doc.url)}
                              className="text-blue-600 hover:text-blue-800 truncate max-w-xs flex items-center"
                              title={doc.name}
                            >
                              <span className="mr-1">📎</span>
                              {doc.name}
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(app.id, doc._id || doc.id)}
                              className="text-red-500 hover:text-red-700 ml-2 text-lg"
                              title="Delete document"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        
                        {/* Upload New Documents */}
                        <label
                          className={`px-3 py-1 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 text-xs inline-block ${
                            uploadingId === app.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingId === app.id ? 'Uploading...' : 'Add Documents'}
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={e => handleFileUpload(app.id, e.target.files)}
                            disabled={uploadingId === app.id}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                        </label>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === 'hired' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status || 'applied'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={app.status || 'applied'}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="applied">Applied</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationsPage