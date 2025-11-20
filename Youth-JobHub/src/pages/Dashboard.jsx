// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      setUser(userData);
      
      // Redirect based on user role
      if (userData.role === 'jobseeker') {
        navigate("/job-dashboard");
      } else if (userData.role === 'employer') {
        navigate("/employer-dashboard");
      }
      // If no specific role, stay on this dashboard
    } else {
      // Redirect to login if not logged in
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Welcome, {user.name || user.email}!
        </h1>
        <p className="text-gray-700 mb-2">
          Role: <span className="font-semibold capitalize">{user.role}</span>
        </p>
        <p className="text-gray-700 mb-6">
          Redirecting you to your dashboard...
        </p>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;