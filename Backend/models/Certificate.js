const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CertificateTemplate',
    required: true
  },
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  candidatePhone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  vacancyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vacancy',
    default: null
  },
  vacancyTitle: {
    type: String,
    default: '',
    trim: true
  },
  finalExamSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinalExamSubmission',
    default: null
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  qrVerificationUrl: {
    type: String,
    required: true
  },
  // Snapshot of template elements and background at the time of issuing (lossless guarantee)
  templateSnapshot: {
    backgroundImageUrl: { type: String, required: true },
    originalWidth: { type: Number, default: 1920 },
    originalHeight: { type: Number, default: 1080 },
    elements: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  revokeReason: {
    type: String,
    default: null
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', CertificateSchema);
