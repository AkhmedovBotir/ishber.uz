const { HttpError } = require("../utils/HttpError");
const adminService = require("../services/adminService");

function validateRequiredCreateFields(body) {
  const required = ["firstName", "lastName", "phoneNumber", "username", "password"];
  const missing = required.filter((field) => !body[field]);

  if (missing.length > 0) {
    throw new HttpError(400, `Missing fields: ${missing.join(", ")}`);
  }
}

async function createAdmin(req, res) {
  validateRequiredCreateFields(req.body);
  const admin = await adminService.createAdmin(req.body);
  res.status(201).json(admin);
}

async function getAllAdmins(_req, res) {
  const admins = await adminService.getAllAdmins();
  res.json(admins);
}

async function getAdminById(req, res) {
  const admin = await adminService.getAdminById(req.params.id);
  res.json(admin);
}

async function updateAdminById(req, res) {
  const admin = await adminService.updateAdminById(req.params.id, req.body);
  res.json(admin);
}

async function deleteAdminById(req, res) {
  await adminService.deleteAdminById(req.params.id);
  res.status(204).send();
}

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdminById,
  deleteAdminById,
};
