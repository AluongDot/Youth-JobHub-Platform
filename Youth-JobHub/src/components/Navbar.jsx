import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-4">
        <Link to="/" className="text-2xl font-bold">YouthJobHub</Link>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="hover:text-yellow-300">Home</Link>
          <Link to="/about" className="hover:text-yellow-300">About</Link>
          <Link to="/jobs" className="hover:text-yellow-300">Jobs</Link>
          <Link to="/contact" className="hover:text-yellow-300">Contact</Link>
          {user && user.role === "employer" && (
            <>
              <Link to="/post-job" className="hover:text-yellow-300 font-semibold">+ Post Job</Link>
              <Link to="/employer-dashboard" className="hover:text-yellow-300">Dashboard</Link>
            </>
          )}
          {user && user.role === "jobseeker" && (
            <Link to="/job-dashboard" className="hover:text-yellow-300">My Applications</Link>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex space-x-4 items-center">
          {!user ? (
            <>
              <Link
                to="/login"
                className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="border border-white px-4 py-2 rounded-md hover:bg-white hover:text-blue-600"
              >
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-md hover:bg-yellow-300"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-600 px-3 pb-4 space-y-2">
          <Link to="/" className="block hover:text-yellow-300">Home</Link>
          <Link to="/about" className="block hover:text-yellow-300">About</Link>
          <Link to="/jobs" className="block hover:text-yellow-300">Jobs</Link>
          <Link to="/contact" className="block hover:text-yellow-300">Contact Us</Link>
          {user && user.role === "employer" && (
            <>
              <Link to="/post-job" className="block hover:text-yellow-300 font-semibold">+ Post Job</Link>
              <Link to="/employer-dashboard" className="block hover:text-yellow-300">Dashboard</Link>
            </>
          )}
          {user && user.role === "jobseeker" && (
            <Link to="/job-dashboard" className="block hover:text-yellow-300">My Applications</Link>
          )}

          {!user ? (
            <>
              <Link
                to="/login"
                className="block bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block border border-white px-4 py-2 rounded-md hover:bg-white hover:text-blue-600"
              >
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="block w-full bg-yellow-400 text-blue-900 px-4 py-2 rounded-md hover:bg-yellow-300"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
