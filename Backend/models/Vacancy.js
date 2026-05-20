const mongoose = require("mongoose");

const { Schema } = mongoose;

const vacancySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      required: true,
      trim: true,
    },
    minAge: {
      type: Number,
      required: true,
      min: 0,
    },
    maxAge: {
      type: Number,
      required: true,
      min: 0,
    },
    salary: {
      type: String,
      required: true,
      trim: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    descriptionDelta: {
      type: Schema.Types.Mixed,
      required: true,
    },
    responsibilitiesDelta: {
      type: Schema.Types.Mixed,
      required: true,
    },
    advantagesDelta: {
      type: Schema.Types.Mixed,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "skills must be a non-empty array",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Vacancy = mongoose.model("Vacancy", vacancySchema);

module.exports = { Vacancy };
