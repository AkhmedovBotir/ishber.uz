const interviewService = require("../services/interviewService");

async function createInterview(req, res) {
  const doc = await interviewService.createInterview(req.body);
  res.status(201).json(await interviewService.getInterviewById(doc._id));
}

async function listInterviews(req, res) {
  const list = await interviewService.listInterviews(req.query);
  res.json(list);
}

async function getInterviewById(req, res) {
  const doc = await interviewService.getInterviewById(req.params.id);
  res.json(doc);
}

async function updateInterview(req, res) {
  const doc = await interviewService.updateInterview(req.params.id, req.body);
  res.json(doc);
}

module.exports = {
  createInterview,
  listInterviews,
  getInterviewById,
  updateInterview,
};
