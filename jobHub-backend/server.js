import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import aggregatedJobRoutes from "./routes/aggregatedJobRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: [
      "https://youth-job-hub-platform.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
// Aggregated jobs route
app.use("/api/aggregated-jobs", aggregatedJobRoutes);

// Helpful base API route so requests to /api don't 404.
app.get("/api", (req, res) => {
  res.json({
    message: "YouthJobHub API - available routes: /api/auth, /api/aggregated-jobs, /api/test",
    routes: ["/api/auth", "/api/aggregated-jobs", "/api/test"]
  });
});

// Test route to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Base route
app.get("/", (req, res) => {
  res.send("Welcome to YouthJobHub API!");
});

// Handle 404 for undefined routes
app.use("*", notFound);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Auth routes available at http://localhost:${PORT}/api/auth`);
  console.log(`✅ Aggregated jobs route available at http://localhost:${PORT}/api/aggregated-jobs`);
  console.log(`✅ Uploads directory available at http://localhost:${PORT}/uploads`);
});