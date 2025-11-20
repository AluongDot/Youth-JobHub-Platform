import express from "express";
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getExternalJobs, // ✅ Added for job aggregation
} from "../controllers/jobController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { jobCreateValidation } from "../utils/validation.js";
import { validateRequest } from "../middleware/validationMiddleware.js";


const router = express.Router();

// 🧠 Public routes
router.get("/", getJobs);
router.get("/:id", getJob);

// 🧠 External aggregated jobs (public)
router.get("/external/jobs", getExternalJobs); // ✅ Added route for job aggregation

// 🔐 Protected routes (requires authentication)
router.post(
  "/",
  protect,
  authorizeRoles("employer", "admin"),
  jobCreateValidation,
  validateRequest,
  createJob
);

router.put(
  "/:id",
  protect,
  authorizeRoles("employer", "admin"),
  updateJob
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("employer", "admin"),
  deleteJob
);

export default router;
