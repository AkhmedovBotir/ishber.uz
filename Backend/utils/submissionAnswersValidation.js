const mongoose = require("mongoose");

const { HttpError } = require("./HttpError");

const OPTION_BASED_TYPES = ["select", "multiselect", "radio", "checkbox"];
const ARRAY_VALUE_TYPES = ["multiselect", "checkbox"];

function isEmptyValue(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === "string" && value.trim() === "") {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
}

function normalizeAnswersInput(raw) {
  if (!Array.isArray(raw)) {
    throw new HttpError(400, "answers must be an array");
  }

  const normalized = raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new HttpError(400, `answers[${index}] must be an object`);
    }

    if (!item.questionId) {
      throw new HttpError(400, `answers[${index}].questionId is required`);
    }

    if (!mongoose.Types.ObjectId.isValid(item.questionId)) {
      throw new HttpError(400, `answers[${index}].questionId is invalid`);
    }

    if (!Object.prototype.hasOwnProperty.call(item, "value")) {
      throw new HttpError(400, `answers[${index}].value is required`);
    }

    return {
      questionId: item.questionId,
      value: item.value,
    };
  });

  const seen = new Set();
  for (const row of normalized) {
    const key = String(row.questionId);
    if (seen.has(key)) {
      throw new HttpError(400, `Duplicate answer for questionId ${key}`);
    }
    seen.add(key);
  }

  return normalized;
}

function validateAnswerValue(question, value) {
  const { type } = question;

  if (ARRAY_VALUE_TYPES.includes(type)) {
    if (!Array.isArray(value)) {
      throw new HttpError(400, `Question "${question.question}" expects an array value`);
    }
    if (OPTION_BASED_TYPES.includes(type)) {
      for (const v of value) {
        if (!question.options.includes(v)) {
          throw new HttpError(400, `Invalid option for question "${question.question}"`);
        }
      }
    }
    return;
  }

  if (OPTION_BASED_TYPES.includes(type)) {
    if (typeof value !== "string" || !question.options.includes(value)) {
      throw new HttpError(400, `Invalid option for question "${question.question}"`);
    }
  }
}

function validateAnswersAgainstForm(form, answersInput) {
  const questions = form.questions || [];
  const byId = new Map(questions.map((q) => [String(q._id), q]));

  for (const row of answersInput) {
    const q = byId.get(String(row.questionId));
    if (!q) {
      throw new HttpError(400, `Unknown questionId: ${row.questionId}`);
    }
    validateAnswerValue(q, row.value);
  }

  for (const q of questions) {
    if (!q.required) {
      continue;
    }

    const row = answersInput.find((a) => String(a.questionId) === String(q._id));
    if (!row || isEmptyValue(row.value)) {
      throw new HttpError(400, `Required question not answered: "${q.question}"`);
    }
  }
}

module.exports = {
  normalizeAnswersInput,
  validateAnswersAgainstForm,
  isEmptyValue,
};
