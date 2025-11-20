import Job from "../models/Job.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios"; // ✅ Added for external API requests

// 🧭 Get all jobs (local DB)
export const getJobs = async (req, res, next) => {
  try {
    let { page = 1, limit = 20, q, type, location } = req.query;
    page = Number(page) || 1;
    limit = Number(limit) || 20;

    const filter = {};
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { title: regex },
        { company: regex },
        { description: regex },
        { requirements: regex },
      ];
    }
    if (type) filter.type = type;
    if (location) filter.location = { $regex: new RegExp(location, "i") };

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort({ datePosted: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    res.json({
      data: jobs,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// 🧭 Get single job
export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "postedBy",
      "name email role"
    );
    if (!job) {
      res.status(404);
      return next(new Error("Job not found"));
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

// 🧱 Create job (local)
export const createJob = async (req, res, next) => {
  try {
    const {
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
      applyLink,
      source,
      deadline,
      featuredImageBase64,
    } = req.body;

    const job = new Job({
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
      applyLink,
      source,
      deadline: deadline ? new Date(deadline) : undefined,
      postedBy: req.user ? req.user._id : undefined,
    });

    // Upload image to Cloudinary (optional)
    if (featuredImageBase64) {
      const upload = await cloudinary.uploader.upload(featuredImageBase64, {
        folder: "jobhub/jobs",
        resource_type: "image",
      });
      job.featuredImage = upload.secure_url;
    }

    const saved = await job.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

// 🧱 Update job
export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404);
      return next(new Error("Job not found"));
    }

    const fields = [
      "title",
      "company",
      "location",
      "type",
      "description",
      "requirements",
      "salary",
      "applyLink",
      "source",
      "deadline",
      "isVerified",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) job[f] = req.body[f];
    });

    if (req.body.featuredImageBase64) {
      const upload = await cloudinary.uploader.upload(
        req.body.featuredImageBase64,
        {
          folder: "jobhub/jobs",
          resource_type: "image",
        }
      );
      job.featuredImage = upload.secure_url;
    }

    const updated = await job.save();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 🧹 Delete job
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404);
      return next(new Error("Job not found"));
    }
    await job.remove();
    res.json({ message: "Job removed" });
  } catch (err) {
    next(err);
  }
};

// 🌍 NEW: External Job Aggregator (Adzuna + Jooble)
export const getExternalJobs = async (req, res) => {
  try {
    const [adzunaRes, joobleRes] = await Promise.all([
      axios.get("https://api.adzuna.com/v1/api/jobs/ke/search/1", {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          results_per_page: 10,
          what: "developer",
        },
      }),
      axios.post("https://jooble.org/api/" + process.env.JOOBLE_API_KEY, {
        keywords: "developer",
        location: "Kenya",
      }),
    ]);

    const combinedJobs = [
      ...(adzunaRes.data.results || []),
      ...(joobleRes.data.jobs || []),
    ];

    res.json({ success: true, jobs: combinedJobs });
  } catch (error) {
    console.error("Job aggregation error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Error fetching external jobs" });
  }
};
