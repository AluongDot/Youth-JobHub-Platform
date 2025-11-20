import React from 'react'
import { Link } from 'react-router-dom'

const JobCard = ({ job }) => {
  const formatSalary = (salary) => {
    if (!salary) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary)
  }

  const getJobTypeColor = (type) => {
    const colors = {
      'Full-time': 'bg-green-100 text-green-800',
      'Part-time': 'bg-blue-100 text-blue-800',
      'Contract': 'bg-purple-100 text-purple-800',
      'Internship': 'bg-orange-100 text-orange-800',
      'Remote': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            <Link to={`/jobs/${job.id}`} className="hover:text-blue-600 transition-colors">
              {job.title}
            </Link>
          </h3>
          <p className="text-gray-600 mb-1">{job.company}</p>
          <p className="text-gray-500 text-sm">{job.location}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.type)}`}>
          {job.type}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{formatSalary(job.salary)}</span>
          {job.salary && <span> / year</span>}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {job.applications || 0} applicants
        </span>
        <Link 
          to={`/jobs/${job.id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

export default JobCard