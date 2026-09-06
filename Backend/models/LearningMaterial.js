const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      default: () => ["", ""],
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const materialImageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    url: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const learningMaterialSchema = new mongoose.Schema(
  {
    vacancyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    descriptionDelta: {
      type: Object,
      default: () => ({ ops: [] }),
    },
    videoType: {
      type: String,
      enum: ["url", "file", "none"],
      default: "none",
    },
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    videoFile: {
      type: String,
      default: "",
    },
    images: {
      type: [materialImageSchema],
      default: [],
    },
    quiz: {
      type: [quizQuestionSchema],
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

learningMaterialSchema.index({ vacancyId: 1, order: 1 });

const LearningMaterial = mongoose.model("LearningMaterial", learningMaterialSchema);

module.exports = { LearningMaterial };
