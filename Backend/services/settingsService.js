const axios = require("axios");
const { SystemSettings } = require("../models/SystemSettings");

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds memory cache

async function getSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedSettings;
  }

  let doc = await SystemSettings.findOne({ key: "default" }).lean();
  if (!doc) {
    // Initialize with default values
    const created = await SystemSettings.create({
      key: "default",
      applicationFormBaseUrl: process.env.APPLICATION_FORM_BASE_URL || "http://localhost:5174",
      applicationFormApplyPath: process.env.APPLICATION_FORM_APPLY_PATH || "vacancies/{vacancyId}/apply",
      eskizEmail: (process.env.ESKIZ_EMAIL || "").includes("example.com") ? "" : (process.env.ESKIZ_EMAIL || ""),
      eskizPassword: (process.env.ESKIZ_PASSWORD || "").includes("example.com") ? "" : (process.env.ESKIZ_PASSWORD || ""),
      eskizFrom: "4546",
      submissionSmsOnSubmit: true,
      submissionSmsOnAccept: true,
      submissionSmsOnReject: true,
      interviewReminderOffsetMinutes: Number(process.env.INTERVIEW_REMINDER_OFFSET_MINUTES) || 0,
      interviewTimezone: process.env.INTERVIEW_TIMEZONE || "Asia/Tashkent",
    });
    doc = created.toObject();
  }

  cachedSettings = doc;
  lastFetchTime = now;
  return doc;
}

function getCachedSettingsSync() {
  if (cachedSettings) return cachedSettings;
  return {
    applicationFormBaseUrl: process.env.APPLICATION_FORM_BASE_URL || "http://localhost:5174",
    applicationFormApplyPath: process.env.APPLICATION_FORM_APPLY_PATH || "vacancies/{vacancyId}/apply",
    eskizEmail: process.env.ESKIZ_EMAIL || "",
    eskizPassword: process.env.ESKIZ_PASSWORD || "",
    eskizFrom: "4546",
    submissionSmsOnSubmit: true,
    submissionSmsOnAccept: true,
    submissionSmsOnReject: true,
  };
}

async function updateSettings(data) {
  const allowed = [
    "applicationFormBaseUrl",
    "applicationFormApplyPath",
    "eskizEmail",
    "eskizPassword",
    "eskizFrom",
    "submissionSmsOnSubmit",
    "submissionSmsOnAccept",
    "submissionSmsOnReject",
    "interviewReminderOffsetMinutes",
    "interviewTimezone",
  ];

  const updatePayload = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updatePayload[key] = data[key];
    }
  }

  const updated = await SystemSettings.findOneAndUpdate(
    { key: "default" },
    { $set: updatePayload },
    { new: true, upsert: true }
  ).lean();

  cachedSettings = updated;
  lastFetchTime = Date.now();

  // Also notify eskizService to clear its token cache
  const eskizService = require("./eskizService");
  if (eskizService && typeof eskizService.resetTokenCache === "function") {
    eskizService.resetTokenCache();
  }

  return updated;
}

async function testEskizConnection(customCredentials = null) {
  const current = await getSettings();
  const email = (customCredentials?.email || current.eskizEmail || "").trim();
  const password = (customCredentials?.password || current.eskizPassword || "").trim();

  if (!email || !password) {
    throw new Error("Eskiz email yoki parol kiritilmagan");
  }

  if (email.includes("example.com") || email === "your_eskiz_email@example.com") {
    throw new Error("Iltimos, haqiqiy Eskiz.uz hisob ma'lumotlarini kiriting");
  }

  try {
    const authRes = await axios.post("https://notify.eskiz.uz/api/auth/login", {
      email,
      password,
    });

    const token = authRes.data?.data?.token;
    if (!token) {
      throw new Error("Eskiz token qaytarmadi");
    }

    // Try fetching user profile / balance
    let userData = null;
    try {
      const userRes = await axios.get("https://notify.eskiz.uz/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      userData = userRes.data?.data || userRes.data || null;
    } catch {
      // User info optional
    }

    return {
      success: true,
      message: "Eskiz.uz bilan ulanish muvaffaqiyatli o'rnatildi!",
      user: userData,
    };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.response?.statusText || err.message;
    const statusCode = err.response?.status || 500;
    throw new Error(`Eskiz ulanish xatosi (${statusCode}): ${errorMsg}`);
  }
}

async function sendTestSms(phone, message) {
  const eskizService = require("./eskizService");
  const testMsg = message || "Ishber.uz: Bu tizim sozlamalaridan yuborilgan test SMS xabari.";
  const res = await eskizService.sendSMS(phone, testMsg);
  if (!res.success) {
    throw new Error(res.error || "SMS yuborishda xatolik");
  }
  return res;
}

module.exports = {
  getSettings,
  getCachedSettingsSync,
  updateSettings,
  testEskizConnection,
  sendTestSms,
};
