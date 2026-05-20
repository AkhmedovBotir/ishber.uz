const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { Admin } = require("../models/Admin");
const { HttpError } = require("../utils/HttpError");

function buildTokenPayload(admin) {
  return {
    sub: String(admin._id),
    username: admin.username,
    role: "admin",
  };
}

function getJwtConfig() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  return { secret, expiresIn };
}

async function loginWithUsernameAndPassword(username, password) {
  if (!username || !password) {
    throw new HttpError(400, "username and password are required");
  }

  const admin = await Admin.findOne({ username }).select("+password");
  if (!admin) {
    throw new HttpError(401, "Invalid username or password");
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new HttpError(401, "Invalid username or password");
  }

  const { secret, expiresIn } = getJwtConfig();
  const token = jwt.sign(buildTokenPayload(admin), secret, { expiresIn });

  return {
    token,
    admin: admin.toJSON(),
  };
}

module.exports = {
  loginWithUsernameAndPassword,
};
