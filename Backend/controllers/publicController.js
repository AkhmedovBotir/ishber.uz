const publicApplicationService = require("../services/publicApplicationService");

async function getPublicVacancy(req, res) {
  const data = await publicApplicationService.getPublicVacancy(req.params.vacancyId);
  res.json(data);
}

async function getPublicVacancyForm(req, res) {
  const data = await publicApplicationService.getPublicVacancyWithForm(req.params.vacancyId);
  res.json(data);
}

async function submitPublicApplication(req, res) {
  const submission = await publicApplicationService.submitApplicationForVacancy(
    req.params.vacancyId,
    req.body
  );
  res.status(201).json(submission);
}

module.exports = {
  getPublicVacancy,
  getPublicVacancyForm,
  submitPublicApplication,
};
