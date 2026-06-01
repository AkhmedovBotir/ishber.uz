const express = require("express");

const applicationSubmissionController = require("../controllers/applicationSubmissionController");
const vacancyController = require("../controllers/vacancyController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vacancies
 *   description: Vacancy CRUD endpoints
 */

/**
 * @swagger
 * /api/vacancies/{vacancyId}/application-submissions:
 *   get:
 *     summary: List application submissions for a vacancy (admin panel)
 *     tags: [Vacancies]
 *     parameters:
 *       - in: path
 *         name: vacancyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeAnswers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Standart false — answers (base64 fayllar) ro‘yxatdan chiqariladi
 *     responses:
 *       200:
 *         description: List of submissions (answers omitted by default)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApplicationSubmission'
 */
router.get(
  "/:vacancyId/application-submissions",
  applicationSubmissionController.listByVacancyId
);

/**
 * @swagger
 * /api/vacancies:
 *   post:
 *     summary: Create vacancy
 *     tags: [Vacancies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VacancyCreateInput'
 *     responses:
 *       201:
 *         description: Vacancy created
 *   get:
 *     summary: Get all vacancies
 *     tags: [Vacancies]
 *     responses:
 *       200:
 *         description: List of vacancies
 */
router.route("/").post(vacancyController.createVacancy).get(vacancyController.getAllVacancies);

/**
 * @swagger
 * /api/vacancies/{id}:
 *   get:
 *     summary: Get vacancy by id
 *     tags: [Vacancies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vacancy object
 *   put:
 *     summary: Update vacancy by id
 *     tags: [Vacancies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VacancyUpdateInput'
 *     responses:
 *       200:
 *         description: Updated vacancy
 *   delete:
 *     summary: Delete vacancy by id
 *     tags: [Vacancies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 */
router
  .route("/:id")
  .get(vacancyController.getVacancyById)
  .put(vacancyController.updateVacancyById)
  .delete(vacancyController.deleteVacancyById);

module.exports = router;
