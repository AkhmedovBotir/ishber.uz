const express = require("express");

const applicationFormController = require("../controllers/applicationFormController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ApplicationForms
 *   description: Vacancy application form CRUD endpoints
 */

/**
 * @swagger
 * /api/application-forms:
 *   post:
 *     summary: Create application form
 *     tags: [ApplicationForms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicationFormCreateInput'
 *     responses:
 *       201:
 *         description: Application form created
 *   get:
 *     summary: Get all application forms
 *     tags: [ApplicationForms]
 *     responses:
 *       200:
 *         description: List of application forms
 */
router
  .route("/")
  .post(applicationFormController.createApplicationForm)
  .get(applicationFormController.getAllApplicationForms);

/**
 * @swagger
 * /api/application-forms/send-link-sms:
 *   post:
 *     summary: Send application form link to phone via SMS
 *     tags: [ApplicationForms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplicationFormSendSmsInput'
 *     responses:
 *       200:
 *         description: SMS sent successfully
 */
router.post("/send-link-sms", applicationFormController.sendApplicationFormLinkSMS);

/**
 * @swagger
 * /api/application-forms/vacancy/{vacancyId}:
 *   get:
 *     summary: Get application form by vacancy id
 *     tags: [ApplicationForms]
 *     parameters:
 *       - in: path
 *         name: vacancyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application form object
 */
router.get("/vacancy/:vacancyId", applicationFormController.getApplicationFormByVacancyId);

/**
 * @swagger
 * /api/application-forms/{id}:
 *   get:
 *     summary: Get application form by id
 *     tags: [ApplicationForms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application form object
 *   put:
 *     summary: Update application form by id
 *     tags: [ApplicationForms]
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
 *             $ref: '#/components/schemas/ApplicationFormUpdateInput'
 *     responses:
 *       200:
 *         description: Updated application form
 *   delete:
 *     summary: Delete application form by id
 *     tags: [ApplicationForms]
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
  .get(applicationFormController.getApplicationFormById)
  .put(applicationFormController.updateApplicationFormById)
  .delete(applicationFormController.deleteApplicationFormById);

module.exports = router;
