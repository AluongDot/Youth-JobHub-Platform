import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../services/api";
import Loader from "../components/Loader";

function JobSeekerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      setUser(userData);
      
      // Verify user is jobseeker
      if (userData.role !== 'jobseeker') {
        navigate("/dashboard");
        return;
      }
      
      // Fetch applications
      fetchMyApplications();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const apps = await api.getMyApplications();
      setApplications(apps);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: "bg-gray-100 text-gray-800",
      reviewing: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
      hired: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!user) return <Loader fullScreen size="large" />;
  if (loading) return <Loader fullScreen size="large" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Job Seeker Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.name || user.email}!
            </p>
          </div>
          <div className="space-x-4">
            <Link
              to="/jobs"
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition inline-block"
            >
              Browse Jobs
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Applications */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6">My Applications</h2>
            
            {applications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">You haven't applied to any jobs yet</p>
                <Link
                  to="/jobs"
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition inline-block"
                >
                  Start Browsing Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <Link
                          to={`/jobs/${app.job?._id}`}
                          className="text-xl font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {app.job?.title || "Job"}
                        </Link>
                        <p className="text-gray-600">
                          {app.job?.company} • {app.job?.location}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Applied: {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>

                    {app.coverLetter && (
                      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Your Cover Letter:</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{app.coverLetter}</p>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Link
                        to={`/jobs/${app.job?._id}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition text-center text-sm"
                      >
                        View Job
                      </Link>
                      <button
                        className={`flex-1 py-2 px-4 rounded text-sm font-medium ${
                          app.status === "hired"
                            ? "bg-green-100 text-green-700 cursor-not-allowed"
                            : app.status === "rejected"
                            ? "bg-red-100 text-red-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        disabled
                      >
                        {app.status === "hired" && "🎉 You're Hired!"}
                        {app.status === "rejected" && "❌ Rejected"}
                        {app.status === "reviewing" && "⏳ Under Review"}
                        {app.status === "applied" && "✓ Applied"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Applications:</span>
                  <span className="font-bold text-blue-600">{applications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Under Review:</span>
                  <span className="font-bold text-orange-600">
                    {applications.filter(a => a.status === 'reviewing').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Offers Received:</span>
                  <span className="font-bold text-green-600">
                    {applications.filter(a => a.status === 'hired').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <Link
                to="/jobs"
                className="w-full block text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition mb-3"
              >
                Browse Jobs
              </Link>
              <button className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition text-sm">
                Edit Profile
              </button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Tips</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Write a strong cover letter</li>
                <li>• Keep your profile updated</li>
                <li>• Apply to jobs you're qualified for</li>
                <li>• Follow up after applying</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JobSeekerDashboard;