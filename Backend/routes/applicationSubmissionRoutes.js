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
 * /api/application-submissions:
 *   get:
 *     summary: Barcha vakansiyalar bo‘yicha arizalar (nomzodlar)
 *     tags: [ApplicationSubmissions]
 *     parameters:
 *       - in: query
 *         name: vacancyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeAnswers
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Barcha arizalar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApplicationSubmission'
 */
router.get("/", applicationSubmissionController.listAll);

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

/**
 * @swagger
 * /api/application-submissions/{id}/candidate:
 *   patch:
 *     summary: Nomzod qilib olish yoki nomzodlikdan chiqarish
 *     tags: [ApplicationSubmissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isCandidate:
 *                 type: boolean
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationSubmission'
 */
router.patch("/:id/candidate", applicationSubmissionAdminController.toggleCandidate);

module.exports = router;
