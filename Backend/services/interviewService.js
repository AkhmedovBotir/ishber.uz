const mongoose = require("mongoose");

const { Interview, ADDRESS_MODES, INTERVIEW_STATUSES } = require("../models/Interview");
const { Vacancy } = require("../models/Vacancy");
const { ApplicationSubmission } = require("../models/ApplicationSubmission");
const { HttpError } = require("../utils/HttpError");

function validateObjectId(id, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
}

function validatePhone(phone) {
  const p = String(phone || "").trim();
  if (p.replace(/\D/g, "").length < 9) {
    throw new HttpError(400, "Nomzod telefoni noto‘g‘ri");
  }
  return p;
}

function parseScheduledAt(value) {
  if (!value) {
    throw new HttpError(400, "scheduledAt majburiy (ISO 8601 yoki sana+vaqt)");
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new HttpError(400, "scheduledAt noto‘g‘ri format");
  }
  return d;
}

function validateAddress(body) {
  const { addressMode, addressText, placeLabel, coordinates } = body;
  if (!ADDRESS_MODES.includes(addressMode)) {
    throw new HttpError(400, "addressMode text, url yoki place bo‘lishi kerak");
  }
  if (addressMode === "url") {
    if (!addressText || !String(addressText).trim()) {
      throw new HttpError(400, "addressMode=url uchun addressText (havola) majburiy");
    }
  }
  if (addressMode === "text") {
    if (!addressText || !String(addressText).trim()) {
      throw new HttpError(400, "addressMode=text uchun addressText majburiy");
    }
  }
  if (addressMode === "place") {
    const hasCoords =
      coordinates &&
      typeof coordinates.lat === "number" &&
      Number.isFinite(coordinates.lat) &&
      typeof coordinates.lng === "number" &&
      Number.isFinite(coordinates.lng);
    const hasLabel = (placeLabel && String(placeLabel).trim()) || (addressText && String(addressText).trim());
    if (!hasCoords && !hasLabel) {
      throw new HttpError(400, "addressMode=place uchun joy nomi yoki koordinatalar kerak");
    }
  }
}

async function createInterview(body) {
  const {
    applicationSubmissionId,
    candidateName,
    candidatePhone,
    vacancyId,
    topic,
    interviewerName,
    addressMode,
    addressText,
    placeLabel,
    coordinates,
    scheduledAt,
  } = body;

  if (!candidateName || !topic || !interviewerName) {
    throw new HttpError(400, "candidateName, topic, interviewerName majburiy");
  }

  validateObjectId(vacancyId, "vacancyId");
  validateAddress(body);

  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy) {
    throw new HttpError(404, "Vakansiya topilmadi");
  }

  if (applicationSubmissionId) {
    validateObjectId(applicationSubmissionId, "applicationSubmissionId");
    const sub = await ApplicationSubmission.findById(applicationSubmissionId);
    if (!sub || String(sub.vacancyId) !== String(vacancyId)) {
      throw new HttpError(400, "Ariza shu vakansiyaga tegishli emas yoki topilmadi");
    }
  }

  const phone = validatePhone(candidatePhone);
  const when = parseScheduledAt(scheduledAt);

  return Interview.create({
    applicationSubmissionId: applicationSubmissionId || null,
    candidateName: String(candidateName).trim(),
    candidatePhone: phone,
    vacancyId,
    topic: String(topic).trim(),
    interviewerName: String(interviewerName).trim(),
    addressMode,
    addressText: addressText != null ? String(addressText).trim() : "",
    placeLabel: placeLabel != null ? String(placeLabel).trim() : "",
    ...(addressMode === "place" &&
    coordinates &&
    typeof coordinates.lat === "number" &&
    typeof coordinates.lng === "number"
      ? { coordinates: { lat: coordinates.lat, lng: coordinates.lng } }
      : {}),
    scheduledAt: when,
    status: "scheduled",
    reminderSmsSent: false,
  });
}

async function listInterviews(query) {
  const filter = {};
  if (query.vacancyId) {
    validateObjectId(query.vacancyId, "vacancyId");
    filter.vacancyId = query.vacancyId;
  }
  if (query.status) {
    if (!INTERVIEW_STATUSES.includes(query.status)) {
      throw new HttpError(400, "Noto‘g‘ri status");
    }
    filter.status = query.status;
  }

  const list = await Interview.find(filter).sort({ scheduledAt: 1 }).lean();
  const vacancyIds = [...new Set(list.map((i) => String(i.vacancyId)))];
  const vacancies = await Vacancy.find({ _id: { $in: vacancyIds } })
    .select("title")
    .lean();
  const titleById = new Map(vacancies.map((v) => [String(v._id), v.title]));

  return list.map((i) => ({
    ...i,
    vacancyTitle: titleById.get(String(i.vacancyId)) || "",
  }));
}

async function getInterviewById(id) {
  validateObjectId(id);
  const doc = await Interview.findById(id).lean();
  if (!doc) {
    throw new HttpError(404, "Suhbat topilmadi");
  }
  const vacancy = await Vacancy.findById(doc.vacancyId).select("title").lean();
  return { ...doc, vacancyTitle: vacancy?.title || "" };
}

async function updateInterview(id, body) {
  validateObjectId(id);
  const doc = await Interview.findById(id);
  if (!doc) {
    throw new HttpError(404, "Suhbat topilmadi");
  }

  if (body.scheduledAt !== undefined && doc.status === "scheduled") {
    doc.scheduledAt = parseScheduledAt(body.scheduledAt);
    doc.reminderSmsSent = false;
    doc.reminderSmsSentAt = null;
    if (body.rescheduleRequested === undefined) {
      doc.rescheduleRequested = false;
    }
  }

  if (body.addressMode !== undefined) {
    doc.addressMode = body.addressMode;
  }
  if (body.addressText !== undefined) {
    doc.addressText = String(body.addressText).trim();
  }
  if (body.placeLabel !== undefined) {
    doc.placeLabel = String(body.placeLabel).trim();
  }
  if (body.coordinates !== undefined) {
    if (
      body.coordinates &&
      typeof body.coordinates.lat === "number" &&
      typeof body.coordinates.lng === "number"
    ) {
      doc.coordinates = { lat: body.coordinates.lat, lng: body.coordinates.lng };
    } else {
      doc.set("coordinates", undefined);
    }
  }

  validateAddress({
    addressMode: doc.addressMode,
    addressText: doc.addressText,
    placeLabel: doc.placeLabel,
    coordinates: doc.coordinates,
  });

  if (body.topic !== undefined) {
    doc.topic = String(body.topic).trim();
  }
  if (body.interviewerName !== undefined) {
    doc.interviewerName = String(body.interviewerName).trim();
  }
  if (body.candidateName !== undefined) {
    doc.candidateName = String(body.candidateName).trim();
  }
  if (body.candidatePhone !== undefined) {
    doc.candidatePhone = validatePhone(body.candidatePhone);
  }

  if (body.status !== undefined) {
    if (!INTERVIEW_STATUSES.includes(body.status)) {
      throw new HttpError(400, "Noto‘g‘ri status");
    }
    doc.status = body.status;
  }

  if (body.rating !== undefined) {
    const r = Number(body.rating);
    if (body.rating !== null && (!Number.isFinite(r) || r < 1 || r > 5)) {
      throw new HttpError(400, "rating 1–5 yoki null");
    }
    doc.rating = body.rating === null ? null : r;
  }
  if (body.passed !== undefined) {
    doc.passed = body.passed === null ? null : Boolean(body.passed);
  }
  if (body.rescheduleRequested !== undefined) {
    doc.rescheduleRequested = Boolean(body.rescheduleRequested);
  }
  if (body.adminNotes !== undefined) {
    doc.adminNotes = String(body.adminNotes || "").trim();
  }

  if (body.markEvaluated === true) {
    doc.evaluatedAt = new Date();
    if (doc.status === "scheduled") {
      doc.status = "completed";
    }
  }

  await doc.save();
  return getInterviewById(id);
}

module.exports = {
  createInterview,
  listInterviews,
  getInterviewById,
  updateInterview,
};
