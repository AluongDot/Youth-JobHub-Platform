import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import * as api from '../services/api'

// File types accepted for upload
const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt'
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const JobDetailsPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)
  const [applicationSuccess, setApplicationSuccess] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})

  const checkApplicationStatus = useCallback(async (jobId) => {
    try {
      const applications = await api.getUserApplications()
      const hasAppliedToJob = applications.some(app => app.job._id === jobId || app.job === jobId)
      setHasApplied(hasAppliedToJob)
    } catch (err) {
      console.error('Error checking application status:', err)
      setHasApplied(false)
    }
  }, [])

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getJob(id)
      setJob(data)
      
      if (user && user.role === 'jobseeker') {
        await checkApplicationStatus(data._id || data.id)
      }
    } catch (err) {
      setError('Job not found or failed to load job details.')
      console.error('Error fetching job:', err)
    } finally {
      setLoading(false)
    }
  }, [id, user, checkApplicationStatus])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  // Enhanced file validation
  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 5MB.`
    }
    
    const fileExtension = file.name.split('.').pop().toLowerCase()
    const allowedExtensions = ACCEPTED_FILE_TYPES.replace(/\./g, '').split(',')
    
    if (!allowedExtensions.includes(fileExtension)) {
      return `File type "${fileExtension}" is not allowed. Accepted types: ${ACCEPTED_FILE_TYPES}`
    }
    
    return null
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files)
    
    if (files.length + selectedFiles.length > MAX_FILES) {
      setError(`You can only upload a maximum of ${MAX_FILES} documents. You already have ${selectedFiles.length} files selected.`)
      event.target.value = null
      return
    }

    // Validate each file
    const validFiles = []
    const errors = []
    
    files.forEach(file => {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(validationError)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setError(errors.join(', '))
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles])
      setError('')
    }
    
    event.target.value = null // Reset input to allow selecting same files again
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    // Clear progress for removed file
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[index]
      return newProgress
    })
  }

  const handleApply = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } })
      return
    }

    if (user.role !== 'jobseeker') {
      setError('Only job seekers can apply for jobs')
      return
    }

    if (hasApplied) {
      setError('You have already applied for this job')
      return
    }
    
    // Enhanced validation
    if (!coverLetter.trim() && selectedFiles.length === 0) {
      setError('Please provide a cover letter or upload at least one document (resume, certificate, etc.).')
      return
    }

    try {
      setApplying(true)
      setError('')
      
      const formData = new FormData()
      formData.append('coverLetter', coverLetter || generateDefaultCoverLetter())
      
      // Append files with progress tracking
      selectedFiles.forEach((file, index) => {
        formData.append('documents', file)
        setUploadProgress(prev => ({ ...prev, [index]: 0 }))
      })

      // Simulate upload progress (you can integrate with actual progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          Object.keys(newProgress).forEach(key => {
            if (newProgress[key] < 90) {
              newProgress[key] += 10
            }
          })
          return newProgress
        })
      }, 100)

      // Use the correct API function
      await api.applyForJobWithDocuments(id, formData)
      
      clearInterval(progressInterval)
      setUploadProgress({})
      setApplicationSuccess(true)
      setHasApplied(true)
      setCoverLetter('')
      setSelectedFiles([])
      setShowApplicationForm(false)
      
      fetchJob()
      
      // Redirect to success page
      setTimeout(() => {
        navigate('/submission-success')
      }, 2000)
      
    } catch (err) {
      console.error('❌ Error applying for job:', err)
      setUploadProgress({})
      
      const errorMsg = err.response?.data?.message || 'Failed to submit application. Please try again.'
      const backendErrors = err.response?.data?.errors?.join(', ') || ''
      
      if (err.response?.status === 400 && errorMsg.includes('already applied')) {
        setError('You have already applied for this job')
        setHasApplied(true)
      } else if (err.response?.status === 400) {
        setError(backendErrors || errorMsg)
      } else if (err.response?.status === 401) {
        setError('Please log in to apply for jobs.')
        navigate('/login')
      } else if (err.response?.status === 403) {
        setError('Only job seekers can apply for jobs.')
      } else {
        setError(errorMsg)
      }
    } finally {
      setApplying(false)
    }
  }

  const generateDefaultCoverLetter = () => {
    if (!job) return "I'm interested in this position."
    return `Dear Hiring Manager,

I am excited to apply for the ${job.title} position at ${job.company}. I believe my skills and experience align well with your requirements.

Thank you for considering my application.

Best regards,
${user?.name || 'Applicant'}`
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    switch (ext) {
      case 'pdf': return '📄'
      case 'doc': case 'docx': return '📝'
      case 'jpg': case 'jpeg': case 'png': return '🖼️'
      case 'txt': return '📃'
      default: return '📎'
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getApplyButtonText = () => {
    if (hasApplied) return 'Already Applied'
    if (user?.role !== 'jobseeker') return 'Apply Now'
    return 'Apply Now'
  }

  const isApplyDisabled = () => {
    return hasApplied || user?.role !== 'jobseeker' || applicationSuccess
  }

  if (loading) return <Loader text="Loading job details..." />
  
  if (error && !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <Link 
            to="/jobs" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  if (!job) return <div className="text-center py-12">Job not found</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        to="/jobs" 
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Jobs
      </Link>

      {/* Job Header */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-xl text-gray-700 mb-4">{job.company} • {job.location}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {job.type}
              </span>
              {job.salary && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {formatSalary(job.salary)}/year
                </span>
              )}
              {job.remote && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Remote
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Apply Button & Form */}
          <div className="w-full lg:w-96">
            {applicationSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="font-semibold text-green-800 mb-1">Application Submitted!</div>
                <div className="text-sm text-green-600">Redirecting to success page...</div>
              </div>
            ) : showApplicationForm ? (
              <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Apply for this Position</h3>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Cover Letter Input */}
                <div className="mb-6">
                  <label htmlFor="coverLetter" className="block text-sm font-semibold text-gray-700 mb-2">
                    Cover Letter {!coverLetter && <span className="text-gray-500 font-normal">(recommended)</span>}
                  </label>
                  <textarea
                    id="coverLetter"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell the employer why you're a good fit for this position. Include your relevant experience, skills, and why you're interested in this role..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition-colors"
                    rows="5"
                    maxLength="2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {coverLetter.length}/2000 characters
                  </p>
                </div>
                
                {/* Enhanced File Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Documents ({selectedFiles.length}/{MAX_FILES})
                  </label>
                  
                  {/* File Input */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mb-4">
                    <input
                      type="file"
                      id="documents"
                      multiple
                      accept={ACCEPTED_FILE_TYPES}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="documents" className="cursor-pointer">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="text-gray-600 font-medium mb-1">Click to upload documents</div>
                      <p className="text-sm text-gray-500">
                        Supports: PDF, DOC, DOCX, JPG, PNG, TXT • Max: {MAX_FILES} files • 5MB each
                      </p>
                    </label>
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">Selected Files:</h4>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center space-x-3 flex-1">
                            <span className="text-lg">{getFileIcon(file.name)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Upload Progress */}
                          {uploadProgress[index] !== undefined && (
                            <div className="w-20 bg-gray-200 rounded-full h-2 mx-3">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[index]}%` }}
                              ></div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            disabled={applying}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* File Type Suggestions */}
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <h5 className="text-sm font-semibold text-blue-900 mb-2">Recommended Documents:</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Resume/CV (Required)</li>
                      <li>• Cover Letter (Recommended)</li>
                      <li>• Certificates or Diplomas</li>
                      <li>• Portfolio Samples</li>
                      <li>• Reference Letters</li>
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleApply}
                    disabled={applying || (!coverLetter.trim() && selectedFiles.length === 0)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {applying ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading & Submitting...
                      </span>
                    ) : `Submit Application ${selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}`}
                  </button>
                  <button
                    onClick={() => {
                      setShowApplicationForm(false)
                      setError('')
                      setSelectedFiles([])
                      setCoverLetter('')
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                    disabled={applying}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowApplicationForm(true)}
                disabled={isApplyDisabled()}
                className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  isApplyDisabled() 
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {getApplyButtonText()}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <span>Posted {formatDate(job.createdAt)}</span>
          <span className="mx-2">•</span>
          <span>{job.applications || 0} {job.applications === 1 ? 'applicant' : 'applicants'}</span>
        </div>
      </div>
      
      {/* Rest of job details content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Description */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Job Description</h2>
            <div className="prose max-w-none text-gray-600">
              {job.description ? (
                job.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph || <br />}</p>
                ))
              ) : (
                <p className="text-gray-500 italic">No description provided.</p>
              )}
            </div>
          </section>

          {/* Responsibilities */}
          {job.responsibilities && (
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Responsibilities</h2>
              <ul className="space-y-2 text-gray-600">
                {job.responsibilities.split('\n').filter(Boolean).map((responsibility, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {responsibility}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          {job.requirements && (
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Requirements</h2>
              <ul className="space-y-2 text-gray-600">
                {job.requirements.split('\n').filter(Boolean).map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {requirement}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">About {job.company}</h3>
            <p className="text-gray-600 text-sm">
              {job.companyDescription || "We're looking for talented individuals to join our growing team. If you're passionate about making an impact, we'd love to hear from you."}
            </p>
          </div>

          {/* Job Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Job Type:</span>
                <span className="font-medium">{job.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{job.location}</span>
              </div>
              {job.salary && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Salary:</span>
                  <span className="font-medium">{formatSalary(job.salary)}/year</span>
                </div>
              )}
              {job.remote && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Remote:</span>
                  <span className="font-medium">Yes</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Posted:</span>
                <span className="font-medium">{formatDate(job.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Share Job */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Share This Job</h3>
            <div className="flex space-x-4">
              <button 
                onClick={() => navigator.share?.({
                  title: job.title,
                  text: `Check out this ${job.title} position at ${job.company}`,
                  url: window.location.href,
                })}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobDetailsPage