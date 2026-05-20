/**
 * Brauzerlarda `uz-UZ` + month: 'short' ba'zan "M05" kabi noto'g'ri chiqadi.
 * Barcha UI uchun bir xil, lotin yozuvidagi o'zbek sana formatlari.
 */

const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
];

const UZ_WEEKDAYS = [
  'yakshanba',
  'dushanba',
  'seshanba',
  'chorshanba',
  'payshanba',
  'juma',
  'shanba',
];

function toValidDate(value) {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Masalan: 13 may 2026 */
export function formatUzDate(value) {
  const d = toValidDate(value);
  if (!d) return '-';
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Masalan: 13 may 2026, 14:05 */
export function formatUzDateTime(value) {
  const d = toValidDate(value);
  if (!d) return '-';
  const datePart = formatUzDate(d);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${datePart}, ${h}:${m}`;
}

/** Masalan: chorshanba, 14 may 2026 */
export function formatUzDateWithWeekday(value) {
  const d = toValidDate(value);
  if (!d) return '-';
  const wd = UZ_WEEKDAYS[d.getDay()];
  return `${wd}, ${formatUzDate(d)}`;
}
