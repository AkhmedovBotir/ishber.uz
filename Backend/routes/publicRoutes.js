const express = require("express");

const publicController = require("../controllers/publicController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PublicForm
 *   description: Endpoints for the public application form app (no admin auth)
 */

/**
 * @swagger
 * /api/public/vacancies/{vacancyId}:
 *   get:
 *     summary: Get open vacancy for apply flow (includes applicationFormUrl)
 *     tags: [PublicForm]
 *     parameters:
 *       - in: path
 *         name: vacancyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vacancy JSON
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vacancy'
 *       404:
 *         description: Not found or closed
 */
router.get("/vacancies/:vacancyId", publicController.getPublicVacancy);

/**
 * @swagger
 * /api/public/vacancies/{vacancyId}/form:
 *   get:
 *     summary: Get vacancy + active application form (for rendering the form)
 *     tags: [PublicForm]
 *     parameters:
 *       - in: path
 *         name: vacancyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: vacancy and form
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicVacancyFormResponse'
 *       404:
 *         description: Vacancy closed or no active form
 */
router.get("/vacancies/:vacancyId/form", publicController.getPublicVacancyForm);

/**
 * @swagger
 * /api/public/vacancies/{vacancyId}/applications:
 *   post:
 *     summary: Submit application answers for a vacancy
 *     tags: [PublicForm]
 *     parameters:
 *       - in: path
 *         name: vacancyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublicApplicationSubmitInput'
 *     responses:
 *       201:
 *         description: Submission stored
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationSubmission'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vacancy or form not available
 */
router.post("/vacancies/:vacancyId/applications", publicController.submitPublicApplication);

module.exports = router;
