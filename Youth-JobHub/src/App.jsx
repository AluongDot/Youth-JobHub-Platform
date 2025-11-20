import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import JobListPage from "./pages/JobListPage.jsx";
import JobDetailsPage from "./pages/JobDetailsPage.jsx";
import PostJobPage from "./pages/PostJobPage.jsx";
import ApplicationsPage from "./pages/ApplicationsPage.jsx";
import Dashboard from "./pages/Dashboard";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx"; // Add this import
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx"; // Add this import
import About from "./pages/About.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import SubmissionSuccess from "./pages/SubmissionSuccess.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<About />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/post-job" element={<PostJobPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/job-dashboard" element={<JobSeekerDashboard />} />
                <Route path="/employer-dashboard" element={<EmployerDashboard />} />
                <Route path="/jobs" element={<JobListPage />} />
                <Route path="/submission-success" element={<SubmissionSuccess />} />
                <Route path="/jobs/:id" element={<JobDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Add these two new routes */}
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;