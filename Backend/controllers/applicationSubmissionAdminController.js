const submissionAdminService = require("../services/submissionAdminService");

async function getById(req, res) {
  const data = await submissionAdminService.getSubmissionById(req.params.id);
  res.json(data);
}

async function updateSubmissionData(req, res) {
  const data = await submissionAdminService.updateSubmissionData(req.params.id, req.body);
  res.json(data);
}

async function updateStatus(req, res) {
  const data = await submissionAdminService.updateSubmissionStatus(req.params.id, req.body);
  res.json(data);
}

async function markContacted(req, res) {
  const data = await submissionAdminService.markContacted(req.params.id);
  res.json(data);
}

async function addContactNote(req, res) {
  const data = await submissionAdminService.addContactNote(req.params.id, req.body);
  res.json(data);
}

async function toggleCandidate(req, res) {
  const data = await submissionAdminService.toggleCandidatePromotion(
    req.params.id,
    req.body?.isCandidate
  );
  res.json(data);
}

module.exports = {
  getById,
  updateSubmissionData,
  updateStatus,
  markContacted,
  addContactNote,
  toggleCandidate,
};
