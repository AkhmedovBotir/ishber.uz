const mongoose = require("mongoose");

const { ApplicationSubmission } = require("../models/ApplicationSubmission");
const { SubmissionSeqCounter } = require("../models/SubmissionSeqCounter");
const { Vacancy } = require("../models/Vacancy");
const { HttpError } = require("../utils/HttpError");

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid vacancy id");
  }
}

async function allocateSubmissionNumber(vacancyId) {
  if (!mongoose.Types.ObjectId.isValid(vacancyId)) {
    throw new HttpError(400, "Invalid vacancy id");
  }
  const vid = new mongoose.Types.ObjectId(vacancyId);
  const doc = await SubmissionSeqCounter.findOneAndUpdate(
    { vacancyId: vid },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seq = doc && doc.seq != null ? Number(doc.seq) : NaN;
  if (!Number.isFinite(seq) || seq < 1) {
    throw new HttpError(500, "Ariza tartib raqami ajratilmadi (SubmissionSeqCounter)");
  }
  return seq;
}

async function getVacancyTitleById(vacancyId) {
  const v = await Vacancy.findById(vacancyId).select("title").lean();
  return v?.title || "Vakansiya";
}

async function listSubmissionsByVacancyId(vacancyId) {
  validateObjectId(vacancyId);

  const [list, vacancyTitle] = await Promise.all([
    ApplicationSubmission.find({ vacancyId }).sort({ createdAt: -1 }).lean(),
    getVacancyTitleById(vacancyId),
  ]);

  return list.map((s) => ({
    ...s,
    vacancyTitle,
    status: s.status || "pending",
    contactLog: s.contactLog || [],
    displayNumber:
      s.submissionNumber != null && s.submissionNumber > 0
        ? String(s.submissionNumber)
        : String(s._id).slice(-6),
  }));
}

async function createSubmission(payload) {
  const submissionNumber = await allocateSubmissionNumber(payload.vacancyId);
  return ApplicationSubmission.create({
    vacancyId: payload.vacancyId,
    applicationFormId: payload.applicationFormId,
    answers: payload.answers,
    applicantPhone: (payload.applicantPhone || "").trim(),
    submissionNumber,
    status: "pending",
  });
}

module.exports = {
  allocateSubmissionNumber,
  listSubmissionsByVacancyId,
  createSubmission,
  getVacancyTitleById,
};
