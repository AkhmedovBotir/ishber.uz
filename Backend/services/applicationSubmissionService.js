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

function parseIncludeAnswersFlag(value) {
  if (value === true || value === 1) {
    return true;
  }
  const s = String(value ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

async function listSubmissionsByVacancyId(vacancyId, options = {}) {
  validateObjectId(vacancyId);
  const includeAnswers = parseIncludeAnswersFlag(options.includeAnswers);

  const filter = { vacancyId };
  if (options.status) {
    filter.status = options.status;
  }
  if (options.isCandidate !== undefined && options.isCandidate !== null && options.isCandidate !== '') {
    filter.isCandidate = options.isCandidate === true || options.isCandidate === 'true';
  }

  let query = ApplicationSubmission.find(filter).sort({ createdAt: -1 });
  if (!includeAnswers) {
    query = query.select("-answers");
  }

  const [list, vacancyTitle] = await Promise.all([query.lean(), getVacancyTitleById(vacancyId)]);

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

async function listAllSubmissions(options = {}) {
  const filter = {};
  if (options.vacancyId) {
    validateObjectId(options.vacancyId);
    filter.vacancyId = options.vacancyId;
  }
  if (options.status) {
    filter.status = options.status;
  }
  if (options.isCandidate !== undefined && options.isCandidate !== null && options.isCandidate !== '') {
    filter.isCandidate = options.isCandidate === true || options.isCandidate === 'true';
  }
  if (options.search) {
    const q = String(options.search).trim();
    if (q) {
      const num = Number(q);
      const orClauses = [
        { applicantPhone: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" } }
      ];
      if (Number.isInteger(num) && num > 0) {
        orClauses.push({ submissionNumber: num });
      }
      filter.$or = orClauses;
    }
  }

  const includeAnswers = parseIncludeAnswersFlag(options.includeAnswers);

  let query = ApplicationSubmission.find(filter).sort({ createdAt: -1 });
  if (!includeAnswers) {
    query = query.select("-answers");
  }
  if (options.limit && Number(options.limit) > 0) {
    query = query.limit(Number(options.limit));
  }
  if (options.skip && Number(options.skip) > 0) {
    query = query.skip(Number(options.skip));
  }

  const list = await query.lean();
  const vacancyIds = [...new Set(list.map((s) => String(s.vacancyId)).filter(Boolean))];
  const vacancies = await Vacancy.find({ _id: { $in: vacancyIds } }).select("title").lean();
  const titleMap = new Map(vacancies.map((v) => [String(v._id), v.title]));

  return list.map((s) => ({
    ...s,
    vacancyTitle: titleMap.get(String(s.vacancyId)) || "Vakansiya",
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
  parseIncludeAnswersFlag,
  listSubmissionsByVacancyId,
  listAllSubmissions,
  createSubmission,
  getVacancyTitleById,
};
