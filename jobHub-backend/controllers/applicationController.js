import Application from "../models/application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FIXED: Updated applyForJob to handle file uploads
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const applicantId = req.user._id;
    const files = req.files || [];

    console.log('🟡 [BACKEND] Applying for job:', {
      jobId,
      applicantId,
      coverLetterLength: coverLetter?.length,
      filesCount: files.length,
      files: files.map(f => ({ name: f.originalname, size: f.size }))
    });

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      // Clean up uploaded files if job not found
      files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      return res.status(404).json({ 
        success: false, 
        message: "Job not found" 
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: applicantId
    });

    if (existingApplication) {
      // Clean up uploaded files if already applied
      files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      return res.status(400).json({ 
        success: false, 
        message: "You have already applied for this job" 
      });
    }

    // Process uploaded files
    const documents = files.map(file => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      type: determineDocumentType(file.originalname, file.mimetype),
      size: file.size
    }));

    // Create application with documents
    const application = await Application.create({
      job: jobId,
      applicant: applicantId,
      coverLetter: coverLetter || `I'm excited to apply for the ${job.title} position at ${job.company}.`,
      documents: documents,
      status: 'applied'
    });

    console.log('✅ [BACKEND] Application created:', {
      applicationId: application._id,
      documentsCount: application.documents.length
    });

    // Update job applications count - MISSING IN SECOND VERSION
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applications: 1 }
    });

    // Populate application data for response - IMPROVED POPULATION
    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company location type salary createdAt applications')
      .populate('applicant', 'name email profile');

    res.status(201).json({
      success: true,
      application: populatedApplication,
      message: "Application submitted successfully"
    });

  } catch (err) {
    console.error("❌ [BACKEND] Apply for job error:", err);
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.status(500).json({ 
      success: false, 
      message: "Server error during application submission" 
    });
  }
};

export const uploadApplicationDocuments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      // Clean up uploaded files if application not found
      files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check if user owns the application or is employer for the job
    const job = await Job.findById(application.job);
    if (application.applicant.toString() !== req.user._id.toString() && 
        job.postedBy.toString() !== req.user._id.toString()) {
      // Clean up uploaded files
      files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      return res.status(403).json({
        success: false,
        message: "Not authorized to upload documents for this application"
      });
    }

    // Process uploaded files - ADDED SIZE FIELD
    const documentUpdates = files.map(file => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      type: determineDocumentType(file.originalname, file.mimetype),
      size: file.size
    }));

    // Add documents to application
    application.documents.push(...documentUpdates);
    await application.save();

    res.json({
      success: true,
      message: "Documents uploaded successfully",
      documents: documentUpdates
    });

  } catch (err) {
    console.error("Upload documents error:", err);
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during document upload"
    });
  }
};

// Helper function to determine document type - IMPROVED VERSION
const determineDocumentType = (filename, mimetype) => {
  const name = filename.toLowerCase();
  
  if (name.includes('resume') || name.includes('cv')) {
    return 'resume';
  } else if (name.includes('cover')) {
    return 'coverLetter';
  } else if (name.includes('certificate') || name.includes('cert')) {
    return 'certificate';
  } else if (name.includes('.pdf') || name.includes('.doc') || name.includes('.docx') || name.includes('.txt')) {
    return 'document';
  } else if (name.includes('.jpg') || name.includes('.jpeg') || name.includes('.png')) {
    return 'image';
  } else {
    return 'other';
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company location type salary createdAt applications')
      .populate('applicant', 'name email profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (err) {
    console.error("Get my applications error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching applications" 
    });
  }
};

export const getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    console.log('🟡 [BACKEND] Fetching applications for job:', { jobId, userId });

    // Verify job exists and user owns it - IMPROVED CHECK
    const job = await Job.findOne({ 
      _id: jobId
    });

    if (!job) {
      return res.status(404).json({ 
        success: false, 
        message: "Job not found" 
      });
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to view applications for this job" 
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'name email profile')
      .populate('job', 'title company location')
      .sort({ createdAt: -1 });

    console.log('✅ [BACKEND] Applications found:', applications.length);

    res.json({
      success: true,
      applications: applications
    });
  } catch (err) {
    console.error("Get applications by job error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error fetching applications" 
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    console.log('🟡 [BACKEND] Updating application status:', { applicationId, status });

    // Validate status - USING CONSISTENT STATUS VALUES
    const validStatuses = ['applied', 'reviewing', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: applied, reviewing, hired, rejected"
      });
    }

    const application = await Application.findById(applicationId)
      .populate('job', 'postedBy title');

    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: "Application not found" 
      });
    }

    // Check if user owns the job
    if (application.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to update this application" 
      });
    }

    application.status = status;
    application.updatedAt = new Date();
    await application.save();

    // Populate for response - IMPROVED POPULATION
    const populatedApplication = await Application.findById(applicationId)
      .populate('applicant', 'name email profile')
      .populate('job', 'title company location');

    res.json({
      success: true,
      application: populatedApplication,
      message: "Application status updated successfully"
    });
  } catch (err) {
    console.error("Update application status error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error updating application status" 
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check authorization
    const job = await Job.findById(application.job);
    if (application.applicant.toString() !== req.user._id.toString() && 
        job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this document"
      });
    }

    // Find document to delete
    const document = application.documents.id(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', 'uploads', path.basename(document.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove document from array
    application.documents.pull(documentId);
    await application.save();

    res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({
      success: false,
      message: "Server error deleting document"
    });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('job', 'title company location type salary postedBy')
      .populate('applicant', 'name email profile');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check authorization - applicant or job poster
    const job = await Job.findById(application.job._id);
    if (application.applicant._id.toString() !== req.user._id.toString() && 
        job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this application"
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (err) {
    console.error("Get application by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching application"
    });
  }
};

// ADDITIONAL MISSING FUNCTION: Withdraw Application
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check if user owns the application
    if (application.applicant.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this application"
      });
    }

    // Delete associated documents from filesystem
    application.documents.forEach(doc => {
      const filePath = path.join(__dirname, '..', 'uploads', path.basename(doc.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Decrement job applications count
    await Job.findByIdAndUpdate(application.job, {
      $inc: { applications: -1 }
    });

    // Delete application
    await Application.findByIdAndDelete(applicationId);

    res.json({
      success: true,
      message: "Application withdrawn successfully"
    });

  } catch (err) {
    console.error("Withdraw application error:", err);
    res.status(500).json({
      success: false,
      message: "Server error withdrawing application"
    });
  }
};

// ADDITIONAL MISSING FUNCTION: Get Application Statistics
export const getApplicationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // For job seekers: their application stats
    const myApplications = await Application.find({ applicant: userId });
    
    // For employers: stats for their jobs
    const myJobs = await Job.find({ postedBy: userId });
    const jobIds = myJobs.map(job => job._id);
    const jobApplications = await Application.find({ job: { $in: jobIds } });

    const stats = {
      // Job seeker stats
      totalApplications: myApplications.length,
      applicationsByStatus: {
        applied: myApplications.filter(app => app.status === 'applied').length,
        reviewing: myApplications.filter(app => app.status === 'reviewing').length,
        hired: myApplications.filter(app => app.status === 'hired').length,
        rejected: myApplications.filter(app => app.status === 'rejected').length
      },
      
      // Employer stats
      totalJobsPosted: myJobs.length,
      totalApplicationsReceived: jobApplications.length,
      applicationsByJob: myJobs.map(job => ({
        jobId: job._id,
        jobTitle: job.title,
        applicationCount: jobApplications.filter(app => app.job.toString() === job._id.toString()).length
      }))
    };

    res.json({
      success: true,
      stats
    });

  } catch (err) {
    console.error("Get application stats error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching application statistics"
    });
  }
};