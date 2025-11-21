import express from 'express';
import {
  applyForJob,
  uploadApplicationDocuments,
  getMyApplications,
  getApplicationsByJob,
  updateApplicationStatus,
  deleteDocument,
  getApplicationById,
  withdrawApplication,
  getApplicationStats // Add missing import
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// FIXED: Consistent route structure
router.post('/:jobId/apply', protect, upload.array('documents', 5), applyForJob);

// Get current user's applications
router.get('/my-applications', protect, getMyApplications);

// Get specific application by ID
router.get('/:applicationId', protect, getApplicationById);

// Upload additional documents to existing application
router.post('/:applicationId/documents', protect, upload.array('documents', 5), uploadApplicationDocuments);

// Delete document from application
router.delete('/:applicationId/documents/:documentId', protect, deleteDocument);

// Get applications for a specific job (employer only)
router.get('/job/:jobId', protect, getApplicationsByJob);

// Update application status (employer only) - FIXED: consistent PUT method
router.put('/:applicationId/status', protect, updateApplicationStatus);

// ADD: Withdraw application
router.delete('/:applicationId/withdraw', protect, withdrawApplication);

// ADD: Application statistics
router.get('/stats/overview', protect, getApplicationStats);

export default router;