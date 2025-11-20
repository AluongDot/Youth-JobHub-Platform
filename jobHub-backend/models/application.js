import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['resume', 'coverLetter', 'certificate', 'pdf', 'document', 'image', 'other'] // FIXED: Added 'pdf'
  },
  size: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['applied', 'pending', 'reviewed', 'accepted', 'rejected'],
    default: 'applied'
  },
  documents: [documentSchema]
}, { timestamps: true });

// Add indexes for better performance
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ job: 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;