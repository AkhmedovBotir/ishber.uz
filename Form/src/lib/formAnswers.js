import { isCompleteUzPhone, toE164UzPhone } from './uzPhone.js'

const ARRAY_TYPES = new Set(['multiselect', 'checkbox'])
const STORAGE_VALUE_TYPES = new Set(['file', 'image', 'video', 'pdf'])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeUrlInput(raw) {
  const s = (typeof raw === 'string' ? raw : String(raw)).trim()
  if (!s) return null
  try {
    const u = new URL(s)
    if (u.protocol === 'http:' || u.protocol === 'https:') return s
  } catch {
    /* try with scheme */
  }
  try {
    const u = new URL(`https://${s}`)
    if (u.hostname) return `https://${s}`
  } catch {
    /* ignore */
  }
  return null
}

export function initialAnswerValue(question) {
  const type = question?.type
  if (ARRAY_TYPES.has(type)) return []
  if (type === 'boolean') return undefined
  if (type === 'range') return question.required ? 50 : ''
  if (type === 'rating') return ''
  if (type === 'number') return ''
  return ''
}

export function isEmptyClientValue(type, value) {
  if (type === 'boolean') {
    return value !== true && value !== false
  }
  if (value === undefined || value === null) return true
  if (ARRAY_TYPES.has(type)) return !Array.isArray(value) || value.length === 0
  if (type === 'phone') {
    return !isCompleteUzPhone(value)
  }
  if (type === 'rating') {
    if (value === '') return true
    const n = typeof value === 'number' ? value : Number.parseFloat(String(value))
    return !Number.isFinite(n) || n < 1
  }
  if (type === 'number' || type === 'range') {
    if (value === '') return true
    if (typeof value === 'number') return !Number.isFinite(value)
    const n = Number.parseFloat(String(value).trim())
    return !Number.isFinite(n)
  }
  if (typeof value === 'string') return value.trim() === ''
  return false
}

function serializeForApi(question, raw) {
  const { type, question: label } = question

  if (ARRAY_TYPES.has(type)) {
    return Array.isArray(raw) ? raw.map(String) : []
  }

  if (type === 'boolean') return !!raw

  if (type === 'number') {
    const n =
      typeof raw === 'number' ? raw : Number.parseFloat(String(raw).trim())
    if (!Number.isFinite(n)) {
      throw new Error(`"${label}" uchun to‘g‘ri raqam kiriting`)
    }
    return n
  }

  if (type === 'rating') {
    const n =
      typeof raw === 'number' ? raw : Number.parseFloat(String(raw).trim())
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      throw new Error(`"${label}" uchun 1 dan 5 gacha baholang`)
    }
    return n
  }

  if (type === 'range') {
    const n =
      typeof raw === 'number' ? raw : Number.parseFloat(String(raw).trim())
    if (!Number.isFinite(n)) {
      throw new Error(`"${label}" uchun diapazon qiymatini tanlang`)
    }
    return n
  }

  if (type === 'datetime') {
    const s = typeof raw === 'string' ? raw.trim() : String(raw)
    if (!s) throw new Error(`"${label}" bo‘sh`)
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) {
      throw new Error(`"${label}" uchun to‘g‘ri sana-vaqt kiriting`)
    }
    return d.toISOString()
  }

  if (type === 'email') {
    const s = typeof raw === 'string' ? raw.trim() : String(raw)
    if (!EMAIL_RE.test(s)) {
      throw new Error(`"${label}" uchun to‘g‘ri email kiriting`)
    }
    return s
  }

  if (type === 'url') {
    const normalized = normalizeUrlInput(raw)
    if (!normalized) {
      throw new Error(`"${label}" uchun to‘g‘ri havola (URL) kiriting`)
    }
    return normalized
  }

  if (type === 'phone') {
    if (!isCompleteUzPhone(raw)) {
      throw new Error(
        `"${label}" uchun to‘liq telefon kiriting (+998 va 9 ta raqam)`,
      )
    }
    return toE164UzPhone(raw)
  }

  if (STORAGE_VALUE_TYPES.has(type)) {
    return typeof raw === 'string' ? raw.trim() : String(raw)
  }

  return typeof raw === 'string' ? raw.trim() : String(raw)
}

/**
 * @param {Array<{ _id: string, type: string, required?: boolean, question: string }>} questions
 * @param {Record<string, unknown>} valuesByQuestionId
 * @returns {{ answers: Array<{ questionId: string, value: unknown }>, clientError?: string }}
 */
export function buildAnswersPayload(questions, valuesByQuestionId) {
  const answers = []

  for (const q of questions) {
    const id = String(q._id)
    const raw = valuesByQuestionId[id]

    if (q.required && isEmptyClientValue(q.type, raw)) {
      return {
        answers: [],
        clientError: `Majburiy savol: "${q.question}"`,
      }
    }

    if (isEmptyClientValue(q.type, raw)) {
      continue
    }

    try {
      answers.push({
        questionId: id,
        value: serializeForApi(q, raw),
      })
    } catch (e) {
      return { answers: [], clientError: e.message }
    }
  }

  return { answers }
}
