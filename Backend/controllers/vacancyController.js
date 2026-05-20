const { HttpError } = require("../utils/HttpError");
const vacancyService = require("../services/vacancyService");

function validateRequiredCreateFields(body) {
  const required = [
    "title",
    "experience",
    "minAge",
    "maxAge",
    "salary",
    "descriptionDelta",
    "responsibilitiesDelta",
    "advantagesDelta",
    "skills",
  ];

  const missing = required.filter((field) => body[field] === undefined || body[field] === null);
  if (missing.length > 0) {
    throw new HttpError(400, `Missing fields: ${missing.join(", ")}`);
  }
}

function validateIsOpenField(body) {
  if (body.isOpen !== undefined && typeof body.isOpen !== "boolean") {
    throw new HttpError(400, "isOpen must be a boolean");
  }
}

async function createVacancy(req, res) {
  validateRequiredCreateFields(req.body);
  validateIsOpenField(req.body);
  const vacancy = await vacancyService.createVacancy(req.body);
  res.status(201).json(vacancy);
}

async function getAllVacancies(_req, res) {
  const vacancies = await vacancyService.getAllVacancies();
  res.json(vacancies);
}

async function getVacancyById(req, res) {
  const vacancy = await vacancyService.getVacancyById(req.params.id);
  res.json(vacancy);
}

async function updateVacancyById(req, res) {
  validateIsOpenField(req.body);
  const vacancy = await vacancyService.updateVacancyById(req.params.id, req.body);
  res.json(vacancy);
}

async function deleteVacancyById(req, res) {
  await vacancyService.deleteVacancyById(req.params.id);
  res.status(204).send();
}

module.exports = {
  createVacancy,
  getAllVacancies,
  getVacancyById,
  updateVacancyById,
  deleteVacancyById,
};
