const express = require("express");
const finalExamController = require("../controllers/finalExamController");

const router = express.Router();

router.get("/submissions", finalExamController.listSubmissions);
router.get("/submissions/:id", finalExamController.getSubmissionById);
router.patch("/submissions/:id/review", finalExamController.reviewSubmission);

router
  .route("/vacancy/:vacancyId")
  .get(finalExamController.getExamByVacancy)
  .put(finalExamController.saveExamForVacancy);

module.exports = router;
