require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { connectDb } = require("./config/db");
const { Admin } = require("./models/Admin");
const { startInterviewReminderScheduler } = require("./services/interviewReminderScheduler");
const { setupSwagger } = require("./config/swagger");
const { notFound } = require("./middlewares/notFound");
const { errorHandler } = require("./middlewares/errorHandler");
const routes = require("./routes");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors());
const jsonLimit = process.env.EXPRESS_JSON_LIMIT || "1gb";
app.use(express.json({ limit: jsonLimit }));
app.use(morgan("dev"));
setupSwagger(app);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

async function ensureSuperAdminExists() {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const username = process.env.ADMIN_USERNAME || "superadmin";
      const password = process.env.ADMIN_PASSWORD || "superadmin123";
      const phoneNumber = process.env.ADMIN_PHONE || "+998900000000";
      const firstName = process.env.ADMIN_FIRST_NAME || "Super";
      const lastName = process.env.ADMIN_LAST_NAME || "Admin";

      await Admin.create({
        firstName,
        lastName,
        phoneNumber,
        username,
        password,
      });
      // eslint-disable-next-line no-console
      console.log(`🛡️ [XAVFSIZLIK] Bazada admin topilmadi. Avtomatik ravishda boshlang'ich SuperAdmin yaratildi: @${username}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("⚠️ SuperAdmin tekshirishda xatolik:", err.message);
  }
}

async function start() {
  await connectDb(process.env.MONGODB_URI);
  await ensureSuperAdminExists();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on port ${port}`);
    startInterviewReminderScheduler();
  });
}

start();
