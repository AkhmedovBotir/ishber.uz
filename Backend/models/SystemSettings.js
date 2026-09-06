const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      index: true,
    },
    // Public Form App Settings
    applicationFormBaseUrl: {
      type: String,
      default: process.env.APPLICATION_FORM_BASE_URL || "http://localhost:5174",
      trim: true,
    },
    applicationFormApplyPath: {
      type: String,
      default: process.env.APPLICATION_FORM_APPLY_PATH || "vacancies/{vacancyId}/apply",
      trim: true,
    },
    // Eskiz SMS Service Settings
    eskizEmail: {
      type: String,
      default: process.env.ESKIZ_EMAIL || "",
      trim: true,
    },
    eskizPassword: {
      type: String,
      default: process.env.ESKIZ_PASSWORD || "",
      trim: true,
    },
    eskizFrom: {
      type: String,
      default: "4546",
      trim: true,
    },
    // SMS Automation triggers
    submissionSmsOnSubmit: {
      type: Boolean,
      default: true,
    },
    submissionSmsOnAccept: {
      type: Boolean,
      default: true,
    },
    submissionSmsOnReject: {
      type: Boolean,
      default: true,
    },
    // Interview Reminders
    interviewReminderOffsetMinutes: {
      type: Number,
      default: Number(process.env.INTERVIEW_REMINDER_OFFSET_MINUTES) || 0,
    },
    interviewTimezone: {
      type: String,
      default: process.env.INTERVIEW_TIMEZONE || "Asia/Tashkent",
    },
  },
  {
    timestamps: true,
  }
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

module.exports = { SystemSettings };
