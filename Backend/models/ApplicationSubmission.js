const mongoose = require("mongoose");

const { Schema } = mongoose;

const SUBMISSION_STATUSES = ["pending", "accepted", "rejected"];

const answerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const contactLogEntrySchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    outcome: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const applicationSubmissionSchema = new Schema(
  {
    vacancyId: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      index: true,
    },
    applicationFormId: {
      type: Schema.Types.ObjectId,
      ref: "ApplicationForm",
      required: true,
      index: true,
    },
    submissionNumber: {
      type: Number,
      min: 1,
    },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: "pending",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    applicantPhone: {
      type: String,
      trim: true,
      default: "",
    },
    contactedAt: {
      type: Date,
    },
    contactLog: {
      type: [contactLogEntrySchema],
      default: [],
    },
    answers: {
      type: [answerSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

applicationSubmissionSchema.index({ vacancyId: 1, createdAt: -1 });
applicationSubmissionSchema.index({ vacancyId: 1, submissionNumber: 1 });

const ApplicationSubmission = mongoose.model("ApplicationSubmission", applicationSubmissionSchema);

module.exports = { ApplicationSubmission, SUBMISSION_STATUSES };
