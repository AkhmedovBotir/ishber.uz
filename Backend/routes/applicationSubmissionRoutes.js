const express = require("express");

const applicationSubmissionAdminController = require("../controllers/applicationSubmissionAdminController");
const applicationSubmissionController = require("../controllers/applicationSubmissionController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ApplicationSubmissions
 *   description: Nomzod arizalari (admin) — ko‘rish, qabul/bekor, aloqa yozuvlari, SMS
 */

/**
 * @swagger
 * /api/application-submissions/vacancy/{vacancyId}:
 *   get:
 *     summary: Vakansiya bo‘yicha barcha arizalar
 *     tags: [ApplicationSubmissions]
 *     parameters:
 *       - in: path
 *         name: vacancyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ro‘yxat
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApplicationSubmission'
 */
router.get("/vacancy/:vacancyId", applicationSubmissionController.listByVacancyId);

/**
 * @swagger
 * /api/application-submissions/{id}:
 *   get:
 *     summary: Bitta ariza (vacancyTitle, contactLog, status)
 *     tags: [ApplicationSubmissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationSubmission'
 *       404:
 *         description: Topilmadi
 */
router.get("/:id", applicationSubmissionAdminController.getById);

/**
 * @swagger
 * /api/application-submissions/{id}:
 *   patch:
 *     summary: Nomzod ma’lumotlarini tahrirlash (telefon, javoblar)
 *     tags: [ApplicationSubmissions]
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
 *             $ref: '#/components/schemas/ApplicationSubmissionUpdateInput'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationSubmission'
 */
router.patch("/:id", applicationSubmissionAdminController.updateSubmissionData);

/**
 * @swagger
 * /api/application-submissions/{id}/status:
 *   patch:
 *     summary: Qabul qilish yoki bekor qilish (+ Eskiz SMS, default yoqilgan)
 *     tags: [ApplicationSubmissions]
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
 *             $ref: '#/components/schemas/ApplicationSubmissionStatusPatch'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationSubmission'
 *       400:
 *       409:
 */
router.patch("/:id/status", applicationSubmissionAdminController.updateStatus);

/**
 * @swagger
 * /api/application-submissions/{id}/contact:
 *   patch:
 *     summary: Aloqaga chiqilgan deb belgilash (contactedAt)
 *     tags: [ApplicationSubmissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationSubmission'
 */
router.patch("/:id/contact", applicationSubmissionAdminController.markContacted);

/**
 * @swagger
 * /api/application-submissions/{id}/contact-notes:
 *   post:
 *     summary: Aloqa / natija yozuvi (todo tarzida contactLog)
 *     tags: [ApplicationSubmissions]
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
 *             $ref: '#/components/schemas/ApplicationSubmissionContactNoteInput'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationSubmission'
 */
router.post("/:id/contact-notes", applicationSubmissionAdminController.addContactNote);

module.exports = router;
