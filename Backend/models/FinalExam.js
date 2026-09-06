const mongoose = require("mongoose");

const examQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    type: {
      type: String,
      enum: ["radio", "checkbox", "text"],
      default: "radio",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      default: () => ["", ""],
    },
    correctOptionIndex: {
      type: Number,
      default: 0,
    },
    correctOptionIndices: {
      type: [Number],
      default: () => [0],
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const finalExamSchema = new mongoose.Schema(
  {
    vacancyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Yakuniy Nazorat Ishi",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    questions: {
      type: [examQuestionSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const FinalExam = mongoose.model("FinalExam", finalExamSchema);

module.exports = { FinalExam };
