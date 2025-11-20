import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateProfile,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", protect, admin, getUsers);
router.get("/:id", protect, getUserById);
router.put("/profile", protect, updateProfile);

export default router;
