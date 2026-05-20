require("dotenv").config();

const mongoose = require("mongoose");
const { connectDb } = require("../config/db");
const { Admin } = require("../models/Admin");

async function run() {
  const {
    MONGODB_URI,
    ADMIN_FIRST_NAME = "Super",
    ADMIN_LAST_NAME = "Admin",
    ADMIN_PHONE = "+998900000000",
    ADMIN_USERNAME = "superadmin",
    ADMIN_PASSWORD = "superadmin123",
  } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await connectDb(MONGODB_URI);

  const exists = await Admin.findOne({
    $or: [{ username: ADMIN_USERNAME }, { phoneNumber: ADMIN_PHONE }],
  });

  if (exists) {
    // eslint-disable-next-line no-console
    console.log("Admin already exists with this username or phone.");
    await mongoose.disconnect();
    return;
  }

  await Admin.create({
    firstName: ADMIN_FIRST_NAME,
    lastName: ADMIN_LAST_NAME,
    phoneNumber: ADMIN_PHONE,
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  });

  // eslint-disable-next-line no-console
  console.log("Admin created successfully.");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to create admin:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
