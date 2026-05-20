const { Interview } = require("../models/Interview");
const { Vacancy } = require("../models/Vacancy");
const eskizService = require("./eskizService");
const { buildInterviewReminderSms } = require("../utils/interviewSmsTemplates");

function reminderDeadlineDate() {
  const offsetMin = Number(process.env.INTERVIEW_REMINDER_OFFSET_MINUTES || 0);
  const safe = Number.isFinite(offsetMin) ? offsetMin : 0;
  return new Date(Date.now() + safe * 60 * 1000);
}

async function sendReminderForInterviewId(interviewId) {
  const deadline = reminderDeadlineDate();

  const doc = await Interview.findOneAndUpdate(
    {
      _id: interviewId,
      status: "scheduled",
      reminderSmsSent: false,
      scheduledAt: { $lte: deadline },
    },
    { $set: { reminderSmsSent: true, reminderSmsSentAt: new Date() } },
    { new: true }
  );

  if (!doc) {
    return false;
  }

  const vacancy = await Vacancy.findById(doc.vacancyId).select("title").lean();
  const whenLabel = doc.scheduledAt.toLocaleString("uz-UZ", {
    timeZone: process.env.INTERVIEW_TIMEZONE || "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message = buildInterviewReminderSms({
    candidateName: doc.candidateName,
    vacancyTitle: vacancy?.title,
    topic: doc.topic,
    interviewerName: doc.interviewerName,
    addressMode: doc.addressMode,
    addressText: doc.addressText,
    placeLabel: doc.placeLabel,
    coordinates: doc.coordinates,
    whenLabel,
  });

  try {
    await eskizService.sendSMS(doc.candidatePhone, message);
    return true;
  } catch (err) {
    await Interview.updateOne(
      { _id: doc._id },
      { $set: { reminderSmsSent: false, reminderSmsSentAt: null } }
    );
    throw err;
  }
}

async function processDueInterviewReminders() {
  const deadline = reminderDeadlineDate();
  const ids = await Interview.find({
    status: "scheduled",
    reminderSmsSent: false,
    scheduledAt: { $lte: deadline },
  })
    .select("_id")
    .limit(30)
    .lean();

  for (const row of ids) {
    try {
      await sendReminderForInterviewId(row._id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[InterviewReminder]", String(row._id), e && e.message);
    }
  }
}

function startInterviewReminderScheduler() {
  const intervalMs = Number(process.env.INTERVIEW_REMINDER_POLL_MS || 60_000);
  const ms = Number.isFinite(intervalMs) && intervalMs >= 10_000 ? intervalMs : 60_000;

  setInterval(() => {
    processDueInterviewReminders().catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[InterviewReminder] poll", e && e.message);
    });
  }, ms);

  setTimeout(() => {
    processDueInterviewReminders().catch(() => {});
  }, 5_000);
}

module.exports = {
  processDueInterviewReminders,
  startInterviewReminderScheduler,
  sendReminderForInterviewId,
};
