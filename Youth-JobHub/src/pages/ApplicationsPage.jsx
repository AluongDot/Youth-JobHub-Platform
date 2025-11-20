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
    if (!user) return navigate('/login')
    if (user.role !== 'employer') return navigate('/dashboard')
    fetchApplications()
  }, [user])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const { jobs } = await api.getJobs({ limit: 200 })

      const myJobs = jobs.filter(j => {
        return j.postedBy === user?._id || j.postedBy?.toString?.() === user?._id?.toString()
      })

      const allApps = []
      for (const job of myJobs) {
        try {
          const apps = await api.getApplicationsByJob(job.id)
          ;(apps || []).forEach(a => {
            allApps.push({ ...a, job })
          })
        } catch (err) {
          console.error('Failed to fetch apps for job', job.id, err)
        }
      }

      setApplications(allApps)
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appId, status) => {
    try {
      await api.updateApplicationStatus(appId, status)
      await fetchApplications()
    } catch (err) {
      console.error('Failed to update status', err)
      alert('Failed to update status')
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
      console.error('Upload failed', err)
      alert('Failed to upload documents')
    } finally {
      setUploadingId(null)
    }
  }

  const handleViewDocument = (documentUrl) => {
    window.open(`http://localhost:5000${documentUrl}`, '_blank')
  }

  const handleDeleteDocument = async (appId, docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.deleteDocument(appId, docId)
        await fetchApplications()
      } catch (err) {
        console.error('Delete failed', err)
        alert('Failed to delete document')
      }
    }
  }

  if (loading) return <Loader text="Loading applications..." />
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Link to="/post-job" className="text-sm text-blue-600">Post Job</Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-center text-gray-600">
          No applications yet.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Job</th>
                <th className="px-6 py-3">Applicant</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Documents</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map(app => (
                <tr key={app._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{app.job?.title}</div>
                    <div className="text-sm text-gray-600">{app.job?.company}</div>
                  </td>

                  <td className="px-6 py-4">{app.applicant?.name || 'Anonymous'}</td>
                  <td className="px-6 py-4">{app.applicant?.email || 'N/A'}</td>

                  {/* Documents */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {/* Existing Documents */}
                      {app.documents?.map(doc => (
                        <div key={doc._id} className="flex items-center justify-between text-sm">
                          <button
                            onClick={() => handleViewDocument(doc.url)}
                            className="text-blue-600 hover:text-blue-800 truncate max-w-xs"
                            title={doc.name}
                          >
                            📎 {doc.name}
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(app._id, doc._id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Delete document"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload New Documents */}
                      <label
                        className={`px-3 py-1 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 text-xs inline-block ${
                          uploadingId === app._id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingId === app._id ? 'Uploading...' : 'Add Documents'}
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={e => handleFileUpload(app._id, e.target.files)}
                          disabled={uploadingId === app._id}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      app.status === 'hired' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      app.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={app.status}
                      onChange={e => handleStatusChange(app._id, e.target.value)}
                      className="px-2 py-1 border rounded"
                    >
                      <option value="applied">Applied</option>
                      <option value="reviewing">Reviewing</option>
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
  )
}

export default ApplicationsPage