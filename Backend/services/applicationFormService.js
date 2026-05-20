const mongoose = require("mongoose");

const { ApplicationForm, QUESTION_TYPES } = require("../models/ApplicationForm");
const { Vacancy } = require("../models/Vacancy");
const { HttpError } = require("../utils/HttpError");
const { buildApplicationFormUrl } = require("../utils/applicationFormUrl");
const eskizService = require("./eskizService");

const OPTION_BASED_TYPES = ["select", "multiselect", "radio", "checkbox"];

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid id");
  }
}

function validatePhone(phone) {
  if (typeof phone !== "string" || phone.trim().length < 7) {
    throw new HttpError(400, "Invalid phone number");
  }
}

function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) {
    throw new HttpError(400, "questions must be an array");
  }

  return questions.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new HttpError(400, `questions[${index}] must be an object`);
    }

    if (!item.question || typeof item.question !== "string") {
      throw new HttpError(400, `questions[${index}].question is required`);
    }

    if (!item.type || !QUESTION_TYPES.includes(item.type)) {
      throw new HttpError(400, `questions[${index}].type is invalid`);
    }

    if (OPTION_BASED_TYPES.includes(item.type)) {
      if (!Array.isArray(item.options) || item.options.length === 0) {
        throw new HttpError(
          400,
          `questions[${index}].options must be a non-empty array for ${item.type}`
        );
      }
    }

    return item;
  });
}

async function createApplicationForm(payload) {
  validateObjectId(payload.vacancyId);

  const existing = await ApplicationForm.findOne({ vacancyId: payload.vacancyId });
  if (existing) {
    throw new HttpError(409, "Application form for this vacancy already exists");
  }

  const questions = normalizeQuestions(payload.questions || []);
  return ApplicationForm.create({ ...payload, questions });
}

async function getAllApplicationForms() {
  return ApplicationForm.find().sort({ createdAt: -1 });
}

async function getApplicationFormById(id) {
  validateObjectId(id);

  const form = await ApplicationForm.findById(id);
  if (!form) {
    throw new HttpError(404, "Application form not found");
  }

  return form;
}

async function getApplicationFormByVacancyId(vacancyId) {
  validateObjectId(vacancyId);

  const form = await ApplicationForm.findOne({ vacancyId });
  if (!form) {
    throw new HttpError(404, "Application form not found");
  }

  return form;
}

async function updateApplicationFormById(id, payload) {
  validateObjectId(id);

  const existing = await ApplicationForm.findById(id);
  if (!existing) {
    throw new HttpError(404, "Application form not found");
  }

  if (payload.vacancyId !== undefined) {
    validateObjectId(payload.vacancyId);

    const duplicate = await ApplicationForm.findOne({
      vacancyId: payload.vacancyId,
      _id: { $ne: id },
    });

    if (duplicate) {
      throw new HttpError(409, "Application form for this vacancy already exists");
    }

    existing.vacancyId = payload.vacancyId;
  }

  if (payload.nom !== undefined) existing.nom = payload.nom;
  if (payload.status !== undefined) existing.status = payload.status;
  if (payload.questions !== undefined) existing.questions = normalizeQuestions(payload.questions);

  await existing.save();
  return existing;
}

async function deleteApplicationFormById(id) {
  validateObjectId(id);

  const form = await ApplicationForm.findByIdAndDelete(id);
  if (!form) {
    throw new HttpError(404, "Application form not found");
  }
}

async function sendApplicationFormLinkSMS(payload) {
  const { phone, vacancyId } = payload;

  validatePhone(phone);
  validateObjectId(vacancyId);

  const [vacancy, form] = await Promise.all([
    Vacancy.findById(vacancyId),
    ApplicationForm.findOne({ vacancyId, status: "active" }),
  ]);

  if (!vacancy) {
    throw new HttpError(404, "Vacancy not found");
  }

  if (!form) {
    throw new HttpError(404, "Active application form not found for this vacancy");
  }

  const vacancyIdStr = String(vacancy._id);
  const formUrl = buildApplicationFormUrl(vacancyIdStr);
  const vacancyTitle = (vacancy.title || "Vakansiya").trim();
  const message = `${vacancyTitle} vakansiyasi uchun ariza yuborish havolasi: ${formUrl}. Talab va taklif agenycy`;
  const smsResult = await eskizService.sendSMS(phone, message);

  return {
    success: true,
    vacancyId: vacancyIdStr,
    formId: form._id,
    formUrl,
    sms: smsResult,
  };
}

module.exports = {
  createApplicationForm,
  getAllApplicationForms,
  getApplicationFormById,
  getApplicationFormByVacancyId,
  updateApplicationFormById,
  deleteApplicationFormById,
  sendApplicationFormLinkSMS,
};
