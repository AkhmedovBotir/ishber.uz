const applicationSubmissionService = require("../services/applicationSubmissionService");

async function listByVacancyId(req, res) {
  const items = await applicationSubmissionService.listSubmissionsByVacancyId(req.params.vacancyId);
  res.json(items);
}

module.exports = {
  listByVacancyId,
};
