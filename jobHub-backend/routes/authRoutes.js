import express from 'express';
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password/:token', resetPassword); // This route is crucial
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);

export default router;