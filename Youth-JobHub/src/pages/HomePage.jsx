import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImageUrl from "../assets/yjh.png?url";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import * as api from "../services/api";


const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const { jobs } = await api.getJobs({ page: 1, limit: 6 });
        setPosts(jobs);
      } catch (err) {
        console.error("Error fetching jobs for homepage:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO SECTION WITH BACKGROUND IMAGE */}
      <section
        className="w-full h-[70vh] bg-center bg-cover bg-no-repeat relative flex items-center justify-center"
        style={{ backgroundImage: `url(${heroImageUrl})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="relative text-center text-white max-w-2xl px-4">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            Welcome to Youth Job Hub
          </h1>
          <p className="text-lg mb-6 drop-shadow-lg">
            Find job opportunities, learn skills, and grow your career.
          </p>

          <div className="space-x-4">
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Get Started
            </Link>

            <Link
              to="/register"
              className="bg-white text-gray-900 px-6 py-2 rounded-md hover:bg-gray-200 transition"
            >
              Join Us
            </Link>
          </div>
        </div>
        {/* Fallback image for debugging (hidden by default) */}
        <img src={heroImageUrl} alt="Hero preview" className="hidden" />
      </section>

      {/* BLOG POSTS SECTION  */}
      <section className="w-full max-w-6xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          📰 Latest Blog Posts
        </h2>

        {loading && <div className="text-center"><Loader size="large" /></div>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="text-gray-500 text-center">No jobs available yet.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage;
