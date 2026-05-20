const mongoose = require("mongoose");

const { buildApplicationFormUrl } = require("../utils/applicationFormUrl");

const { Schema } = mongoose;

const QUESTION_TYPES = [
  "text",
  "textarea",
  "number",
  "email",
  "phone",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "date",
  "time",
  "datetime",
  "month",
  "week",
    "file",
    "image",
    "video",
    "pdf",
    "url",
  "password",
  "rating",
  "boolean",
  "range",
];

const OPTION_BASED_TYPES = ["select", "multiselect", "radio", "checkbox"];

const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: QUESTION_TYPES,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          if (!OPTION_BASED_TYPES.includes(this.type)) {
            return true;
          }

          return Array.isArray(value) && value.length > 0;
        },
        message: "options must be a non-empty array for select-like question types",
      },
    },
    placeholder: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const applicationFormSchema = new Schema(
  {
    vacancyId: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      unique: true,
    },
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    questions: {
      type: [questionSchema],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

applicationFormSchema.index({ vacancyId: 1, status: 1 });

applicationFormSchema.virtual("applicationFormUrl").get(function formApplicationFormUrl() {
  if (!this.vacancyId) {
    return undefined;
  }
  return buildApplicationFormUrl(this.vacancyId.toString());
});

applicationFormSchema.set("toJSON", { virtuals: true });

const ApplicationForm = mongoose.model("ApplicationForm", applicationFormSchema);

module.exports = { ApplicationForm, QUESTION_TYPES };
