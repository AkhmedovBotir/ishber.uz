const mongoose = require("mongoose");

const { Admin } = require("../models/Admin");
const { HttpError } = require("../utils/HttpError");

function validateObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid admin id");
  }
}

async function ensureUnique(username, phoneNumber, excludeId = null) {
  const query = {
    $or: [{ username }, { phoneNumber }],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const exists = await Admin.findOne(query).lean();

  if (!exists) {
    return;
  }

  if (exists.username === username) {
    throw new HttpError(409, "Username already exists");
  }

  throw new HttpError(409, "Phone number already exists");
}

async function createAdmin(payload) {
  await ensureUnique(payload.username, payload.phoneNumber);
  return Admin.create(payload);
}

async function getAllAdmins() {
  return Admin.find().sort({ createdAt: -1 });
}

async function getAdminById(id) {
  validateObjectId(id);

  const admin = await Admin.findById(id);
  if (!admin) {
    throw new HttpError(404, "Admin not found");
  }

  return admin;
}

async function updateAdminById(id, payload) {
  validateObjectId(id);

  const existing = await Admin.findById(id).select("+password");
  if (!existing) {
    throw new HttpError(404, "Admin not found");
  }

  const nextUsername = payload.username ?? existing.username;
  const nextPhoneNumber = payload.phoneNumber ?? existing.phoneNumber;
  await ensureUnique(nextUsername, nextPhoneNumber, existing._id);

  if (payload.firstName !== undefined) {
    existing.firstName = payload.firstName;
  }
  if (payload.lastName !== undefined) {
    existing.lastName = payload.lastName;
  }
  if (payload.phoneNumber !== undefined) {
    existing.phoneNumber = payload.phoneNumber;
  }
  if (payload.username !== undefined) {
    existing.username = payload.username;
  }
  if (payload.password !== undefined) {
    existing.password = payload.password;
  }

  await existing.save();
  return existing;
}

async function deleteAdminById(id) {
  validateObjectId(id);

  const admin = await Admin.findByIdAndDelete(id);
  if (!admin) {
    throw new HttpError(404, "Admin not found");
  }
}

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdminById,
  deleteAdminById,
};
