/**
 * Eskiz: qisqa SMS; manzil va mavzuni kesish.
 */
const TOPIC_MAX = 48;
const ADDR_MAX = 90;
const NAME_MAX = 28;
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

function formatAddressLine(addressMode, addressText, placeLabel, coordinates) {
  if (addressMode === "url") {
    return truncate(addressText, ADDR_MAX);
  }
  if (addressMode === "place") {
    const label = placeLabel || addressText;
    const coords =
      coordinates && typeof coordinates.lat === "number" && typeof coordinates.lng === "number"
        ? ` ${coordinates.lat.toFixed(5)},${coordinates.lng.toFixed(5)}`
        : "";
    return truncate(`${label}${coords}`.trim(), ADDR_MAX);
  }
  return truncate(addressText, ADDR_MAX);
}

/**
 * Suhbat vaqtida yuboriladigan eslatma SMS.
 */
function buildInterviewReminderSms(payload) {
  const {
    candidateName,
    vacancyTitle,
    topic,
    interviewerName,
    addressMode,
    addressText,
    placeLabel,
    coordinates,
    whenLabel,
  } = payload;

  const who = truncate(candidateName, NAME_MAX);
  const vac = truncate(vacancyTitle || "Vakansiya", 40);
  const subj = truncate(topic, TOPIC_MAX);
  const host = truncate(interviewerName, 24);
  const addr = formatAddressLine(addressMode, addressText, placeLabel, coordinates);
  const when = truncate(whenLabel, 40);

  const raw = `${who}, ${vac} bo'yicha suhbat: ${subj}. Vaqt: ${when}. Suhbat oluvchi: ${host}. Manzil: ${addr}. Talab va taklif agency`;
  return clipMessage(raw);
}

module.exports = { buildInterviewReminderSms, truncate };
