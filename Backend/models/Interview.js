const mongoose = require("mongoose");

const { Schema } = mongoose;

const ADDRESS_MODES = ["text", "url", "place"];

const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "no_show"];

const interviewSchema = new Schema(
  {
    applicationSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: "ApplicationSubmission",
      default: null,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    candidatePhone: {
      type: String,
      required: true,
      trim: true,
    },
    vacancyId: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    interviewerName: {
      type: String,
      required: true,
      trim: true,
    },
    addressMode: {
      type: String,
      enum: ADDRESS_MODES,
      required: true,
    },
    addressText: {
      type: String,
      trim: true,
      default: "",
    },
    placeLabel: {
      type: String,
      trim: true,
      default: "",
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: "scheduled",
      index: true,
    },
    reminderSmsSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    reminderSmsSentAt: {
      type: Date,
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    passed: {
      type: Boolean,
      default: null,
    },
    rescheduleRequested: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

interviewSchema.index({ status: 1, reminderSmsSent: 1, scheduledAt: 1 });

const Interview = mongoose.model("Interview", interviewSchema);

module.exports = { Interview, ADDRESS_MODES, INTERVIEW_STATUSES };
