// backend/routes/aggregatedJobRoutes.js
import express from "express";
import axios from "axios";

const router = express.Router();

// Fetch jobs from multiple free APIs
router.get("/", async (req, res) => {
  try {
    const [adzuna, hhru] = await Promise.all([
      axios.get("https://api.adzuna.com/v1/api/jobs/us/search/1", {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          what: "developer",
          content_type: "application/json"
        }
      }),
      axios.get("https://api.hh.ru/vacancies", {
        params: { text: "developer" }
      })
    ]);

    // Normalize different structures
    const jobs = [ 
      ...adzuna.data.results.map(job => ({
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        url: job.redirect_url,
        source: "Adzuna (US)",
      })),
      ...hhru.data.items.map(job => ({
        title: job.name,
        company: job.employer?.name,
        location: job.area?.name,
        url: job.alternate_url,
        source: "HeadHunter (RU)",
      }))
    ];

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
});

export default router;
