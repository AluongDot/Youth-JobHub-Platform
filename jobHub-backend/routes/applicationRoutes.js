import express from 'express';
import {
  applyForJob,
  uploadApplicationDocuments,
  getMyApplications,
  getApplicationsByJob,
  updateApplicationStatus,
  deleteDocument,
  getApplicationById
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../Middleware/uploadMiddleware.js';

const router = express.Router();

// Apply for a job with file upload support
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

// Update application status (employer only)
router.put('/:applicationId/status', protect, updateApplicationStatus);

export default router;