const publicApplicationService = require("../services/publicApplicationService");
const candidatePortalService = require("../services/candidatePortalService");
const finalExamService = require("../services/finalExamService");

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

async function checkCandidatePhone(req, res) {
  const { phone } = req.body || {};
  const data = await candidatePortalService.checkCandidateByPhone(phone);
  res.json(data);
}

async function updateCandidateName(req, res) {
  const { phone, fullName } = req.body || {};
  const data = await candidatePortalService.updateCandidateName(phone, fullName);
  res.json(data);
}

async function getCandidateVacancyMaterials(req, res) {
  const data = await candidatePortalService.getVacancyMaterials(req.params.vacancyId);
  res.json(data);
}

async function getCandidateFinalExam(req, res) {
  const data = await finalExamService.getExamByVacancy(req.params.vacancyId, true);
  res.json(data);
}

async function submitCandidateFinalExam(req, res) {
  const data = await finalExamService.submitCandidateExam(req.params.vacancyId, req.body);
  res.status(201).json(data);
}

async function getCandidateFinalExamStatus(req, res) {
  const data = await finalExamService.getCandidateExamStatus(req.params.vacancyId, req.query.phone);
  res.json(data);
}

module.exports = {
  getPublicVacancy,
  getPublicVacancyForm,
  submitPublicApplication,
  checkCandidatePhone,
  updateCandidateName,
  getCandidateVacancyMaterials,
  getCandidateFinalExam,
  submitCandidateFinalExam,
  getCandidateFinalExamStatus,
};
