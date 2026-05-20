const express = require("express");
const adminRoutes = require("./adminRoutes");
const authRoutes = require("./authRoutes");
const applicationFormRoutes = require("./applicationFormRoutes");
const applicationSubmissionRoutes = require("./applicationSubmissionRoutes");
const interviewRoutes = require("./interviewRoutes");
const publicRoutes = require("./publicRoutes");
const vacancyRoutes = require("./vacancyRoutes");

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

module.exports = router;
