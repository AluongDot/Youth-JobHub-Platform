// File: src/pages/SubmissionSuccess.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SubmissionSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard"); // Redirect to dashboard instead of home
    }, 5000); // Increased to 5 seconds to let user see success message

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-lg p-8 rounded-xl text-center max-w-md border border-green-200">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-3">
          Application Submitted Successfully!
        </h2>
        <p className="text-gray-600 mb-4">
          Your documents have been uploaded and your application is under review.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-700">
            You will be redirected to your dashboard in a few seconds...
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
};

export default SubmissionSuccess;