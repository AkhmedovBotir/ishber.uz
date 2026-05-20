/** O‘zbekiston mobil: 998 dan keyin 9 ta raqam */
export const UZ_NATIONAL_DIGITS = 9

/** Input ichidagi maska (prefiks +998 alohida) */
export const UZ_PHONE_INPUT_MASK = '9X XXX XX XX'

export function parseUzPhoneNational(raw) {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('998')) d = d.slice(3)
  if (d.length === 10 && d.startsWith('0')) d = d.slice(1)
  return d.slice(0, UZ_NATIONAL_DIGITS)
}

/** Ko‘rinish: 90 123 45 67 */
export function formatUzPhoneNational(digits) {
  const d = parseUzPhoneNational(digits)
  if (!d) return ''
  const parts = [d.slice(0, 2)]
  if (d.length > 2) parts.push(d.slice(2, 5))
  if (d.length > 5) parts.push(d.slice(5, 7))
  if (d.length > 7) parts.push(d.slice(7, 9))
  return parts.filter(Boolean).join(' ')
}

export function toE164UzPhone(digits) {
  const d = parseUzPhoneNational(digits)
  if (!d) return ''
  return `+998${d}`
}

export function isCompleteUzPhone(raw) {
  return parseUzPhoneNational(raw).length === UZ_NATIONAL_DIGITS
}
