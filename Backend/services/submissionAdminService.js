const mongoose = require("mongoose");

const { ApplicationForm } = require("../models/ApplicationForm");
const { ApplicationSubmission } = require("../models/ApplicationSubmission");
const applicationSubmissionService = require("./applicationSubmissionService");
const { HttpError } = require("../utils/HttpError");
const {
  normalizeAnswersInput,
  validateAnswersAgainstForm,
} = require("../utils/submissionAnswersValidation");
const eskizService = require("./eskizService");
const smsTemplates = require("../utils/submissionSmsTemplates");

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid submission id");
  }
}

function displaySubmissionNumber(sub) {
  if (sub.submissionNumber != null && sub.submissionNumber > 0) {
    return String(sub.submissionNumber);
  }
  return String(sub._id).slice(-6);
}

async function assertPhoneForSms(sub) {
  const phone = sub.applicantPhone && String(sub.applicantPhone).trim();
  if (!phone || phone.replace(/\D/g, "").length < 9) {
    throw new HttpError(400, "Nomzod telefoni yo‘q yoki juda qisqa — SMS yuborib bo‘lmaydi");
  }
  return phone;
}

async function getSubmissionById(id) {
  validateObjectId(id);
  const sub = await ApplicationSubmission.findById(id).lean();
  if (!sub) {
    throw new HttpError(404, "Submission not found");
  }
  const vacancyTitle = await applicationSubmissionService.getVacancyTitleById(sub.vacancyId);
  return {
    ...sub,
    status: sub.status || "pending",
    contactLog: sub.contactLog || [],
    vacancyTitle,
    displayNumber: displaySubmissionNumber(sub),
  };
}

async function updateSubmissionStatus(id, body) {
  const { status, rejectionReason, sendSms } = body || {};

  if (status !== "accepted" && status !== "rejected") {
    throw new HttpError(400, "status must be 'accepted' or 'rejected'");
  }

  const sub = await ApplicationSubmission.findById(id);
  if (!sub) {
    throw new HttpError(404, "Submission not found");
  }

  if ((sub.status || "pending") !== "pending") {
    throw new HttpError(409, "Ariza allaqachon yakunlangan (qabul yoki bekor)");
  }

  if (status === "rejected") {
    const reason = (rejectionReason || "").trim();
    if (!reason) {
      throw new HttpError(400, "Bekor qilish uchun rejectionReason majburiy");
    }
    sub.rejectionReason = reason;
  } else {
    sub.rejectionReason = "";
  }

  sub.status = status;
  await sub.save();

  const shouldSend = sendSms !== false;
  if (shouldSend) {
    try {
      const phone = await assertPhoneForSms(sub);
      const title = await applicationSubmissionService.getVacancyTitleById(sub.vacancyId);
      const num = displaySubmissionNumber(sub);
      const message =
        status === "accepted"
          ? smsTemplates.buildAcceptedSms(title, num)
          : smsTemplates.buildRejectedSms(title, num, sub.rejectionReason);
      const smsResult = await eskizService.sendSMS(phone, message);
      if (smsResult && !smsResult.success) {
        if (!Array.isArray(sub.contactLog)) sub.contactLog = [];
        sub.contactLog.push({
          text: `SMS xabarnoma yuborilmadi: ${smsResult.error || "Eskiz xatoligi"}`,
          outcome: "SMS yuborilmadi",
          createdAt: new Date(),
        });
        await sub.save();
      }
    } catch (smsErr) {
      console.warn("[SMS] Ariza holati yangilandi, ammo SMS yuborilmadi:", smsErr.message);
      if (!Array.isArray(sub.contactLog)) sub.contactLog = [];
      sub.contactLog.push({
        text: `SMS xabarnoma yuborilmadi: ${smsErr.message}`,
        outcome: "SMS yuborilmadi",
        createdAt: new Date(),
      });
      await sub.save();
    }
  }

  return getSubmissionById(id);
}

async function markContacted(id) {
  const sub = await ApplicationSubmission.findById(id);
  if (!sub) {
    throw new HttpError(404, "Submission not found");
  }

  sub.contactedAt = new Date();
  await sub.save();

  return getSubmissionById(id);
}

function normalizeApplicantPhone(phone) {
  if (phone === undefined || phone === null) {
    return undefined;
  }
  const p = String(phone).trim();
  if (p && p.replace(/\D/g, "").length < 9) {
    throw new HttpError(400, "Nomzod telefoni noto‘g‘ri");
  }
  return p;
}

async function updateSubmissionData(id, body) {
  const { applicantPhone, answers } = body || {};

  if (applicantPhone === undefined && answers === undefined) {
    throw new HttpError(400, "Kamida bitta maydon kerak: applicantPhone yoki answers");
  }

  const sub = await ApplicationSubmission.findById(id);
  if (!sub) {
    throw new HttpError(404, "Submission not found");
  }

  if (applicantPhone !== undefined) {
    sub.applicantPhone = normalizeApplicantPhone(applicantPhone) ?? "";
  }

  if (answers !== undefined) {
    const form = await ApplicationForm.findById(sub.applicationFormId);
    if (!form) {
      throw new HttpError(404, "Application form not found for this submission");
    }

    const answersInput = normalizeAnswersInput(answers);
    validateAnswersAgainstForm(form, answersInput);
    sub.answers = answersInput.map((a) => ({
      questionId: a.questionId,
      value: a.value,
    }));
  }

  await sub.save();
  return getSubmissionById(id);
}

async function addContactNote(id, body) {
  const { text, outcome } = body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new HttpError(400, "text majburiy");
  }

  const sub = await ApplicationSubmission.findById(id);
  if (!sub) {
    throw new HttpError(404, "Submission not found");
  }

  if (!Array.isArray(sub.contactLog)) {
    sub.contactLog = [];
  }

  sub.contactLog.push({
    text: text.trim(),
    outcome: typeof outcome === "string" ? outcome.trim() : "",
  });
  await sub.save();

  return getSubmissionById(id);
}

async function toggleCandidatePromotion(id, isCandidateVal = null) {
  validateObjectId(id);
  const sub = await ApplicationSubmission.findById(id);
  if (!sub) {
    throw new HttpError(404, "Submission not found");
  }

  const nextVal = typeof isCandidateVal === "boolean" ? isCandidateVal : !sub.isCandidate;
  sub.isCandidate = nextVal;
  sub.candidatePromotedAt = nextVal ? new Date() : null;
  await sub.save();

  return getSubmissionById(id);
}

module.exports = {
  getSubmissionById,
  updateSubmissionData,
  updateSubmissionStatus,
  markContacted,
  addContactNote,
  toggleCandidatePromotion,
};
