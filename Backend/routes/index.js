const express = require("express");
const adminRoutes = require("./adminRoutes");
const authRoutes = require("./authRoutes");
const applicationFormRoutes = require("./applicationFormRoutes");
const applicationSubmissionRoutes = require("./applicationSubmissionRoutes");
const interviewRoutes = require("./interviewRoutes");
const publicRoutes = require("./publicRoutes");
const vacancyRoutes = require("./vacancyRoutes");
const settingsRoutes = require("./settingsRoutes");
const learningMaterialRoutes = require("./learningMaterialRoutes");
const finalExamRoutes = require("./finalExamRoutes");
const certificateRoutes = require("./certificateRoutes");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ message: "API" });
});

router.use("/admins", adminRoutes);
router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/vacancies", vacancyRoutes);
router.use("/application-forms", applicationFormRoutes);
router.use("/application-submissions", applicationSubmissionRoutes);
router.use("/interviews", interviewRoutes);
router.use("/settings", settingsRoutes);
router.use("/learning-materials", learningMaterialRoutes);
router.use("/final-exams", finalExamRoutes);
router.use("/certificates", certificateRoutes);

module.exports = router;

