const express = require("express");

const interviewController = require("../controllers/interviewController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Interviews
 *   description: Nomzod bilan suhbat rejalashtirish va natija
 */

/**
 * @swagger
 * /api/interviews:
 *   post:
 *     summary: Suhbat yaratish (vaqti kelganda Eskiz SMS)
 *     tags: [Interviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InterviewCreateInput'
 *     responses:
 *       201:
 *         description: Yaratildi
 *   get:
 *     summary: Ro‘yxat (?vacancyId=&status=)
 *     tags: [Interviews]
 *     parameters:
 *       - in: query
 *         name: vacancyId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [scheduled, completed, cancelled, no_show] }
 *     responses:
 *       200:
 *         description: Massiv
 */
router.post("/", interviewController.createInterview);
router.get("/", interviewController.listInterviews);

/**
 * @swagger
 * /api/interviews/{id}:
 *   get:
 *     summary: Bitta suhbat
 *     tags: [Interviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *   patch:
 *     summary: Yangilash — vaqt/manzil, baholash, o‘tdi/o‘tmadi, qayta suhbat, status
 *     tags: [Interviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InterviewUpdateInput'
 */
router.get("/:id", interviewController.getInterviewById);
router.patch("/:id", interviewController.updateInterview);

module.exports = router;
