import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import JobForm from '../components/JobForm'
import api from '../services/api'

const PostJobPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not authenticated or not an employer
  useEffect(() => {
    if (user) {
      // Check role (backend stores 'role', not 'userType')
      if (user.role !== 'employer') {
        navigate('/')
      }
    }
  }, [user, navigate])

  const handleSubmit = async (jobData) => {
    setSubmitting(true)
    setError('')

    try {
      await api.createJob(jobData)
      navigate('/jobs', { state: { message: 'Job posted successfully!' } })
    } catch (err) {
      setError('Failed to post job. Please try again.')
      console.error('Error posting job:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading while auth is initializing
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-blue-600 font-medium">Loading...</span>
      </div>
    )
  }

  // Block non-employers
  if (user.role !== 'employer') {
    return (
      <div className="text-center py-10 text-red-600">
        You do not have permission to post jobs.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Post a New Job</h1>
        <p className="text-gray-600">
          Fill out the form below to post your job opportunity and reach thousands of qualified candidates.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <JobForm onSubmit={handleSubmit} isEditing={false} />

        {submitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Posting job...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Tips for a Great Job Post</h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>• Be specific about the role and responsibilities</li>
          <li>• Highlight required skills and qualifications</li>
          <li>• Include information about your company culture</li>
          <li>• Be transparent about salary and benefits</li>
          <li>• Use clear, professional language</li>
        </ul>
      </div>
    </div>
  )
}

export default PostJobPage
