import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: "Remote" },
    type: { type: String, enum: ["Full-time", "Part-time", "Internship", "Gig", "Volunteer"], default: "Full-time" },
    description: { type: String, required: true },
    requirements: { type: String },
    salary: { type: String },
    applyLink: { type: String }, // external link
    source: { type: String }, // e.g., 'Indeed', 'Employer'
    datePosted: { type: Date, default: Date.now },
    deadline: { type: Date },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // employer user id (optional)
    isVerified: { type: Boolean, default: false },
    featuredImage: { type: String } // cloudinary url
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);
export default Job;
