const finalExamService = require("../services/finalExamService");

async function getExamByVacancy(req, res) {
  const data = await finalExamService.getExamByVacancy(req.params.vacancyId, false);
  res.json(data);
}

async function saveExamForVacancy(req, res) {
  const data = await finalExamService.saveExamForVacancy(req.params.vacancyId, req.body);
  res.json(data);
}

async function listSubmissions(req, res) {
  const data = await finalExamService.listSubmissions(req.query);
  res.json(data);
}

async function getSubmissionById(req, res) {
  const data = await finalExamService.getSubmissionById(req.params.id);
  res.json(data);
}

async function reviewSubmission(req, res) {
  const adminId = req.admin?._id;
  const data = await finalExamService.reviewSubmission(req.params.id, req.body, adminId);
  res.json(data);
}

// Public Candidate Endpoints
async function getPublicExam(req, res) {
  const data = await finalExamService.getExamByVacancy(req.params.vacancyId, true);
  res.json(data);
}

async function submitCandidateExam(req, res) {
  const data = await finalExamService.submitCandidateExam(req.params.vacancyId, req.body);
  res.status(201).json(data);
}

async function getCandidateExamStatus(req, res) {
  const data = await finalExamService.getCandidateExamStatus(req.params.vacancyId, req.query.phone);
  res.json(data);
}

module.exports = {
  getExamByVacancy,
  saveExamForVacancy,
  listSubmissions,
  getSubmissionById,
  reviewSubmission,
  getPublicExam,
  submitCandidateExam,
  getCandidateExamStatus,
};
