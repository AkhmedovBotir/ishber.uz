const mongoose = require("mongoose");

const answerEntrySchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["radio", "checkbox", "text"],
      required: true,
    },
    questionText: {
      type: String,
      default: "",
    },
    options: {
      type: [String],
      default: [],
    },
    selectedOption: {
      type: Number,
      default: null,
    },
    selectedOptions: {
      type: [Number],
      default: [],
    },
    textValue: {
      type: String,
      default: "",
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
  },
  { _id: false }
);

const finalExamSubmissionSchema = new mongoose.Schema(
  {
    vacancyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      index: true,
    },
    applicantPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    candidateName: {
      type: String,
      trim: true,
      default: "Nomzod",
    },
    answers: {
      type: [answerEntrySchema],
      default: [],
    },
    autoScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected"],
      default: "submitted",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

finalExamSubmissionSchema.index({ vacancyId: 1, applicantPhone: 1, createdAt: -1 });

const FinalExamSubmission = mongoose.model("FinalExamSubmission", finalExamSubmissionSchema);

module.exports = { FinalExamSubmission };
