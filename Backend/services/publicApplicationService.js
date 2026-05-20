const mongoose = require("mongoose");

const { ApplicationForm } = require("../models/ApplicationForm");
const { Vacancy } = require("../models/Vacancy");
const { HttpError } = require("../utils/HttpError");
const { buildApplicationFormUrl } = require("../utils/applicationFormUrl");
const applicationSubmissionService = require("./applicationSubmissionService");
const vacancyService = require("./vacancyService");
const eskizService = require("./eskizService");
const smsTemplates = require("../utils/submissionSmsTemplates");
const {
  normalizeAnswersInput,
  validateAnswersAgainstForm,
} = require("../utils/submissionAnswersValidation");

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid vacancy id");
  }
}

async function getPublicVacancy(vacancyId) {
  validateObjectId(vacancyId);

  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy || !vacancy.isOpen) {
    throw new HttpError(404, "Vacancy not found");
  }

  return vacancyService.attachFormLinkToVacancy(vacancy);
}

async function getPublicVacancyWithForm(vacancyId) {
  validateObjectId(vacancyId);

  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy || !vacancy.isOpen) {
    throw new HttpError(404, "Vacancy not found");
  }

  const form = await ApplicationForm.findOne({ vacancyId, status: "active" });
  if (!form) {
    throw new HttpError(404, "Active application form not found for this vacancy");
  }

  const id = vacancy._id.toString();

  return {
    vacancy: {
      ...vacancy.toObject(),
      applicationFormUrl: buildApplicationFormUrl(id),
      applicationFormAvailable: true,
    },
    form: form.toJSON(),
  };
}

function extractApplicantPhoneFromAnswers(form, answersInput) {
  const questions = form.questions || [];
  for (const q of questions) {
    if (q.type !== "phone") {
      continue;
    }
    const row = answersInput.find((a) => String(a.questionId) === String(q._id));
    if (row && typeof row.value === "string" && row.value.trim().length >= 7) {
      return row.value.trim();
    }
  }
  return "";
}

function submissionDisplayNumber(doc) {
  if (doc.submissionNumber != null && doc.submissionNumber > 0) {
    return String(doc.submissionNumber);
  }
  return String(doc._id).slice(-6);
}

async function trySendSubmissionSubmittedSms(submissionDoc, vacancyTitleText) {
  if (process.env.SUBMISSION_SMS_ON_SUBMIT === "false") {
    return;
  }
  const phone = submissionDoc.applicantPhone && String(submissionDoc.applicantPhone).trim();
  if (!phone) {
    return;
  }
  try {
    const title = vacancyTitleText || "Vakansiya";
    const num = submissionDisplayNumber(submissionDoc);
    const message = smsTemplates.buildSubmittedSms(title, num);
    await eskizService.sendSMS(phone, message);
  } catch {
    // Eskiz sozilmagan yoki tarmoq xatosi — ariza saqlangan bo‘lishi kerak
  }
}

async function submitApplicationForVacancy(vacancyId, body) {
  validateObjectId(vacancyId);

  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy || !vacancy.isOpen) {
    throw new HttpError(404, "Vacancy not found or no longer accepting applications");
  }

  const form = await ApplicationForm.findOne({ vacancyId, status: "active" });
  if (!form) {
    throw new HttpError(404, "Active application form not found for this vacancy");
  }

  const answersInput = normalizeAnswersInput(body.answers || []);
  validateAnswersAgainstForm(form, answersInput);

  const applicantPhone =
    (typeof body.phone === "string" && body.phone.trim()) || extractApplicantPhoneFromAnswers(form, answersInput);

  const submission = await applicationSubmissionService.createSubmission({
    vacancyId,
    applicationFormId: form._id,
    answers: answersInput.map((a) => ({
      questionId: a.questionId,
      value: a.value,
    })),
    applicantPhone,
  });

  await trySendSubmissionSubmittedSms(submission, vacancy.title);

  const plain = submission.toObject ? submission.toObject({ flattenMaps: true }) : submission;
  return plain;
}

module.exports = {
  getPublicVacancy,
  getPublicVacancyWithForm,
  submitApplicationForVacancy,
};
