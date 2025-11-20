import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">
          About Youth JobHub
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          Youth JobHub is a digital employment platform connecting young people
          to meaningful opportunities — jobs, internships, and freelance gigs —
          while empowering them with resources for career growth.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold text-blue-700 mb-3">
              Our Mission
            </h2>
            <p className="text-gray-600">
              To empower youth by bridging the gap between talent and
              opportunity, fostering skill development, and driving economic
              growth across Africa.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold text-blue-700 mb-3">
              Our Vision
            </h2>
            <p className="text-gray-600">
              To be Africa’s leading youth employment platform driving
              sustainable, inclusive, and innovative career pathways.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            What We Offer
          </h2>
          <ul className="text-gray-600 space-y-2 max-w-2xl mx-auto text-left list-disc list-inside">
            <li>Verified job listings from trusted employers.</li>
            <li>Easy job application and tracking tools.</li>
            <li>Career tips, mentorship, and learning resources.</li>
            <li>Support for both job seekers and employers.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
