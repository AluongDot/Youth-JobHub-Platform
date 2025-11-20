// utils/scrapeJob.js
import axios from "axios";
import * as cheerio from "cheerio"; // ✅ Correct import for ES modules

export const scrapeExampleSite = async (pageUrl) => {
  try {
    // Fetch HTML content
    const { data } = await axios.get(pageUrl, {
      headers: {
        "User-Agent": "JobHubBot/1.0 (+https://localhost:5000)",
      },
      timeout: 15000, // 15 seconds
    });

    // Load into Cheerio
    const $ = cheerio.load(data);
    const jobs = [];

    // Example selectors (change to match your target site)
    $(".job-listing").each((i, el) => {
      const title = $(el).find(".job-title").text().trim();
      const company = $(el).find(".company").text().trim();
      const location = $(el).find(".location").text().trim();
      const description = $(el).find(".summary").text().trim();
      const applyLink = $(el).find("a.apply").attr("href");

      if (title && company) {
        jobs.push({
          title,
          company,
          location: location || "Remote",
          description,
          applyLink: applyLink ? new URL(applyLink, pageUrl).href : pageUrl,
          source: pageUrl,
        });
      }
    });

    console.log(`✅ Scraped ${jobs.length} jobs from ${pageUrl}`);
    return jobs;
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    return [];
  }
};

// Default export (optional, helpful if imported as default)
export default { scrapeExampleSite };
