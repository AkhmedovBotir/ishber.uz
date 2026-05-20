/**
 * Eskiz / GSM: uzun matnlar bir nechta SMS ga bo‘linadi; qisqa ushlab,
 * bitta SMS ichida qolish uchun sarlavha va sababni cheklaymiz.
 */
const TITLE_MAX = 72;
const REASON_MAX = 100;
const SMS_SAFE_MAX = 480;

function truncate(str, max) {
  const s = String(str || "").trim();
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

function clipMessage(text) {
  const t = String(text || "").trim();
  if (t.length <= SMS_SAFE_MAX) {
    return t;
  }
  return `${t.slice(0, SMS_SAFE_MAX - 1)}…`;
}

function vacancyTitle(title) {
  return truncate(title || "Vakansiya", TITLE_MAX);
}

/** Ariza yuborilganda (nomzodga) */
function buildSubmittedSms(vacancyTitleText, submissionNumber) {
  const title = vacancyTitle(vacancyTitleText);
  const sbmId = submissionNumber;
  const raw = `${title} vakansiyasiga №${sbmId} arizangiz yuborildi. Tez orada ariza natijasini SMS orqali yuboramiz. Talab va taklif agency`;
  return clipMessage(raw);
}

/** Qabul qilinganda */
function buildAcceptedSms(vacancyTitleText, submissionNumber) {
  const title = vacancyTitle(vacancyTitleText);
  const sbmId = submissionNumber;
  const raw = `${title} vakansiyasiga topshirgan №${sbmId} arizangiz qabul qilindi. Tez orada aloqaga chiqamiz. Talab va taklif agency`;
  return clipMessage(raw);
}

/** Bekor qilinganda */
function buildRejectedSms(vacancyTitleText, submissionNumber, reasonCancelled) {
  const title = vacancyTitle(vacancyTitleText);
  const reason = truncate(reasonCancelled || "—", REASON_MAX);
  const sbmId = submissionNumber;
  const raw = `${title} uchun topshirgan №${sbmId} arizangiz bekor qilindi. Sababi: ${reason}. Talab va taklif agency`;
  return clipMessage(raw);
}

module.exports = {
  buildSubmittedSms,
  buildAcceptedSms,
  buildRejectedSms,
  clipMessage,
};
