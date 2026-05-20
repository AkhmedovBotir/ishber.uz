import { API_BASE_URL } from '../config.js'

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message || `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function readJsonResponse(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await readJsonResponse(res)
  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' ? data : res.statusText)
    throw new ApiError(res.status, String(msg || 'So‘rov xatosi'), data)
  }
  return data
}

/** @returns {Promise<object>} */
export function getPublicVacancy(vacancyId) {
  return request(`/api/public/vacancies/${encodeURIComponent(vacancyId)}`)
}

/** @returns {Promise<{ vacancy: object, form: object }>} */
export function getPublicVacancyForm(vacancyId) {
  return request(`/api/public/vacancies/${encodeURIComponent(vacancyId)}/form`)
}

/** @returns {Promise<object>} ApplicationSubmission */
export function submitPublicApplication(vacancyId, payload) {
  return request(
    `/api/public/vacancies/${encodeURIComponent(vacancyId)}/applications`,
    { method: 'POST', body: payload },
  )
}
