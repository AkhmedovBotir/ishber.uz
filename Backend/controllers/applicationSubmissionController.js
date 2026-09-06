const applicationSubmissionService = require("../services/applicationSubmissionService");

async function listByVacancyId(req, res) {
  const items = await applicationSubmissionService.listSubmissionsByVacancyId(req.params.vacancyId, {
    includeAnswers: req.query.includeAnswers,
    status: req.query.status,
    isCandidate: req.query.isCandidate,
  });
  res.json(items);
}

async function listAll(req, res) {
  const items = await applicationSubmissionService.listAllSubmissions({
    vacancyId: req.query.vacancyId,
    status: req.query.status,
    isCandidate: req.query.isCandidate,
    includeAnswers: req.query.includeAnswers,
    search: req.query.search || req.query.q,
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json(items);
}

module.exports = {
  listByVacancyId,
  listAll,
};
