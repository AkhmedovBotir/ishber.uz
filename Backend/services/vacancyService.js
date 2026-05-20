const mongoose = require("mongoose");

const { ApplicationForm } = require("../models/ApplicationForm");
const { Vacancy } = require("../models/Vacancy");
const { HttpError } = require("../utils/HttpError");
const { buildApplicationFormUrl } = require("../utils/applicationFormUrl");

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid vacancy id");
  }
}

function validateAges(minAge, maxAge) {
  if (minAge !== undefined && maxAge !== undefined && Number(minAge) > Number(maxAge)) {
    throw new HttpError(400, "minAge cannot be greater than maxAge");
  }
}

async function getActiveFormVacancyIdSet(vacancyIds) {
  const ids = vacancyIds.filter(Boolean).map((id) => id);
  if (ids.length === 0) {
    return new Set();
  }

  const forms = await ApplicationForm.find({
    vacancyId: { $in: ids },
    status: "active",
  })
    .select("vacancyId")
    .lean();

  return new Set(forms.map((f) => String(f.vacancyId)));
}

function vacancyWithFormLink(vacancy, activeFormVacancyIds) {
  const plain = vacancy.toObject ? vacancy.toObject() : { ...vacancy };
  const id = String(vacancy._id);
  const hasActive = activeFormVacancyIds.has(id);

  return {
    ...plain,
    applicationFormUrl: hasActive ? buildApplicationFormUrl(id) : null,
    applicationFormAvailable: hasActive,
  };
}

async function attachFormLinkToVacancy(vacancy) {
  const activeSet = await getActiveFormVacancyIdSet([vacancy._id]);
  return vacancyWithFormLink(vacancy, activeSet);
}

async function attachFormLinkToVacancies(vacancies) {
  const activeSet = await getActiveFormVacancyIdSet(vacancies.map((v) => v._id));
  return vacancies.map((v) => vacancyWithFormLink(v, activeSet));
}

async function createVacancy(payload) {
  validateAges(payload.minAge, payload.maxAge);
  const created = await Vacancy.create(payload);
  return attachFormLinkToVacancy(created);
}

async function getAllVacancies() {
  const list = await Vacancy.find().sort({ createdAt: -1 });
  return attachFormLinkToVacancies(list);
}

async function getVacancyById(id) {
  validateObjectId(id);

  const vacancy = await Vacancy.findById(id);
  if (!vacancy) {
    throw new HttpError(404, "Vacancy not found");
  }

  return attachFormLinkToVacancy(vacancy);
}

async function updateVacancyById(id, payload) {
  validateObjectId(id);

  const existing = await Vacancy.findById(id);
  if (!existing) {
    throw new HttpError(404, "Vacancy not found");
  }

  const minAge = payload.minAge ?? existing.minAge;
  const maxAge = payload.maxAge ?? existing.maxAge;
  validateAges(minAge, maxAge);

  if (payload.title !== undefined) existing.title = payload.title;
  if (payload.experience !== undefined) existing.experience = payload.experience;
  if (payload.minAge !== undefined) existing.minAge = payload.minAge;
  if (payload.maxAge !== undefined) existing.maxAge = payload.maxAge;
  if (payload.salary !== undefined) existing.salary = payload.salary;
  if (payload.isOpen !== undefined) existing.isOpen = payload.isOpen;
  if (payload.descriptionDelta !== undefined) existing.descriptionDelta = payload.descriptionDelta;
  if (payload.responsibilitiesDelta !== undefined) {
    existing.responsibilitiesDelta = payload.responsibilitiesDelta;
  }
  if (payload.advantagesDelta !== undefined) existing.advantagesDelta = payload.advantagesDelta;
  if (payload.skills !== undefined) existing.skills = payload.skills;

  await existing.save();
  return attachFormLinkToVacancy(existing);
}

async function deleteVacancyById(id) {
  validateObjectId(id);

  const vacancy = await Vacancy.findByIdAndDelete(id);
  if (!vacancy) {
    throw new HttpError(404, "Vacancy not found");
  }
}

module.exports = {
  createVacancy,
  getAllVacancies,
  getVacancyById,
  updateVacancyById,
  deleteVacancyById,
  attachFormLinkToVacancy,
};
