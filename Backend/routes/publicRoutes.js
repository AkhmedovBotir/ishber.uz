const express = require("express");

const publicController = require("../controllers/publicController");

const router = express.Router();

/**
 * Public Vacancy & Application Flow
 */
router.get("/vacancies/:vacancyId", publicController.getPublicVacancy);
router.get("/vacancies/:vacancyId/form", publicController.getPublicVacancyForm);
router.post("/vacancies/:vacancyId/applications", publicController.submitPublicApplication);

/**
 * Candidate Portal Endpoints
 */
router.post("/candidate/check-phone", publicController.checkCandidatePhone);
router.post("/candidate/update-name", publicController.updateCandidateName);
router.get("/candidate/vacancies/:vacancyId/materials", publicController.getCandidateVacancyMaterials);

/**
 * Candidate Final Exam Endpoints
 */
router.get("/candidate/vacancies/:vacancyId/final-exam", publicController.getCandidateFinalExam);
router.post("/candidate/vacancies/:vacancyId/final-exam/submit", publicController.submitCandidateFinalExam);
router.get("/candidate/vacancies/:vacancyId/final-exam/status", publicController.getCandidateFinalExamStatus);

/**
 * Certificate Endpoints (Candidate & Public Verification)
 */
const certificateController = require("../controllers/certificateController");
router.get("/candidate/certificates", certificateController.getCandidateCertificates);
router.get("/certificates/verify/:certificateNumber", certificateController.verifyCertificate);

module.exports = router;

