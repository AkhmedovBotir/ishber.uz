const { HttpError } = require("../utils/HttpError");
const applicationFormService = require("../services/applicationFormService");

function validateRequiredCreateFields(body) {
  const required = ["vacancyId", "nom", "questions"];
  const missing = required.filter((field) => body[field] === undefined || body[field] === null);

  if (missing.length > 0) {
    throw new HttpError(400, `Missing fields: ${missing.join(", ")}`);
  }
}

async function createApplicationForm(req, res) {
  validateRequiredCreateFields(req.body);
  const form = await applicationFormService.createApplicationForm(req.body);
  res.status(201).json(form);
}

async function getAllApplicationForms(_req, res) {
  const forms = await applicationFormService.getAllApplicationForms();
  res.json(forms);
}

async function getApplicationFormById(req, res) {
  const form = await applicationFormService.getApplicationFormById(req.params.id);
  res.json(form);
}

async function getApplicationFormByVacancyId(req, res) {
  const form = await applicationFormService.getApplicationFormByVacancyId(req.params.vacancyId);
  res.json(form);
}

async function updateApplicationFormById(req, res) {
  const form = await applicationFormService.updateApplicationFormById(req.params.id, req.body);
  res.json(form);
}

async function deleteApplicationFormById(req, res) {
  await applicationFormService.deleteApplicationFormById(req.params.id);
  res.status(204).send();
}

async function sendApplicationFormLinkSMS(req, res) {
  const { phone, vacancyId } = req.body;
  if (!phone || !vacancyId) {
    throw new HttpError(400, "Missing fields: phone, vacancyId");
  }

  const result = await applicationFormService.sendApplicationFormLinkSMS({ phone, vacancyId });
  res.json(result);
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
