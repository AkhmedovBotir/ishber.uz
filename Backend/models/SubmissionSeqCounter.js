const mongoose = require("mongoose");

const { Schema } = mongoose;

const submissionSeqCounterSchema = new Schema(
  {
    vacancyId: {
      type: Schema.Types.ObjectId,
      ref: "Vacancy",
      required: true,
      unique: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { versionKey: false }
);

const SubmissionSeqCounter = mongoose.model("SubmissionSeqCounter", submissionSeqCounterSchema);

module.exports = { SubmissionSeqCounter };
