const express = require("express");

const adminController = require("../controllers/adminController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Admin CRUD endpoints
 */

/**
 * @swagger
 * /api/admins:
 *   post:
 *     summary: Create admin
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateInput'
 *     responses:
 *       201:
 *         description: Admin created
 *   get:
 *     summary: Get all admins
 *     tags: [Admins]
 *     responses:
 *       200:
 *         description: List of admins
 */
router.route("/").post(adminController.createAdmin).get(adminController.getAllAdmins);

/**
 * @swagger
 * /api/admins/{id}:
 *   get:
 *     summary: Get admin by id
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin object
 *   put:
 *     summary: Update admin by id
 *     tags: [Admins]
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
 *             $ref: '#/components/schemas/AdminUpdateInput'
 *     responses:
 *       200:
 *         description: Updated admin
 *   delete:
 *     summary: Delete admin by id
 *     tags: [Admins]
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
  .get(adminController.getAdminById)
  .put(adminController.updateAdminById)
  .delete(adminController.deleteAdminById);

module.exports = router;
