// Small helpers that check what the browser sends to the create/edit routes.
// Every problem becomes HTTP 400 with a sentence the admin can read.
import type { H3Event } from 'h3'

export type Body = Record<string, unknown>

export const badRequest = (message: string): never => {
  throw createError({ statusCode: 400, statusMessage: message })
}

/** The request body must be a JSON object, for example { "title": "..." }. */
export const readObjectBody = async (event: H3Event): Promise<Body> => {
  const body = await readBody(event)
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return badRequest('Send a JSON object in the request body')
  }
  return body as Body
}

export const hasKey = (body: Body, key: string): boolean => Object.prototype.hasOwnProperty.call(body, key)

// ---------- one value ----------

/** Required text, trimmed, min to max characters. */
export const requiredText = (value: unknown, field: string, min: number, max: number): string => {
  if (typeof value !== 'string') return badRequest(`${field} is required`)
  const text = value.trim()
  if (text.length < min || text.length > max) return badRequest(`${field} must be ${min} to ${max} characters`)
  return text
}

/** Optional text: missing, null or empty becomes null. */
export const optionalText = (value: unknown, field: string, max: number): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return badRequest(`${field} must be text`)
  const text = value.trim()
  if (text === '') return null
  if (text.length > max) return badRequest(`${field} must be at most ${max} characters`)
  return text
}

/** A whole number from min to max (not text like "5"). */
export const wholeNumber = (value: unknown, field: string, min: number, max: number): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    return badRequest(`${field} must be a whole number from ${min} to ${max}`)
  }
  return value
}

/** Like wholeNumber, but missing or null becomes null. */
export const optionalWholeNumber = (value: unknown, field: string, min: number, max: number): number | null =>
  value === undefined || value === null ? null : wholeNumber(value, field, min, max)

/** A latitude or longitude: missing or null becomes null, otherwise a number from min to max (6 decimals kept). */
export const optionalCoordinate = (value: unknown, field: string, min: number, max: number): number | null => {
  if (value === undefined || value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    return badRequest(`${field} must be a number from ${min} to ${max}`)
  }
  return Math.round(value * 1e6) / 1e6
}

/** true or false. A missing value uses `fallback` (when given), otherwise it is an error. */
export const requiredBoolean = (value: unknown, field: string, fallback?: boolean): boolean => {
  if (value === undefined && fallback !== undefined) return fallback
  if (typeof value !== 'boolean') return badRequest(`${field} must be true or false`)
  return value
}

/** One of a fixed list of words. */
export const oneOfValues = <T extends string>(value: unknown, field: string, allowed: readonly T[]): T => {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    return badRequest(`${field} must be one of: ${allowed.join(', ')}`)
  }
  return value as T
}

/** A date and time as text, for example "2026-11-10T08:00:00Z". Returned in the same standard format. */
export const isoDateTime = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return badRequest(`${field} must be a valid date and time`)
  }
  return new Date(value).toISOString()
}

// ---------- the address ----------

/** The :id in the URL, as a whole number of 1 or more. */
export const routeInt = (event: H3Event, name = 'id'): number => {
  const n = Number(getRouterParam(event, name))
  if (!Number.isInteger(n) || n < 1) return badRequest(`${name} must be a whole number`)
  return n
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The :id in the URL, as a UUID (user ids). */
export const routeUuid = (event: H3Event, name = 'id'): string => {
  const id = getRouterParam(event, name) ?? ''
  if (!UUID.test(id)) return badRequest(`${name} is not valid`)
  return id.toLowerCase()
}

// ---------- a whole body ----------

/** One checker per field. It gets the sent value (or undefined when the field was not sent). */
export type FieldRules = Record<string, (value: unknown) => unknown>

/**
 * Checks a body against the rules and returns only the cleaned fields.
 *  - Creating (partial = false): every field is checked. A rule decides whether a missing field is an
 *    error (required) or becomes null/a default (optional).
 *  - Editing (partial = true): only the fields that were sent are checked, and at least one is needed.
 */
export const pickFields = (body: Body, rules: FieldRules, partial: boolean): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [key, rule] of Object.entries(rules)) {
    if (hasKey(body, key)) out[key] = rule(body[key])
    else if (!partial) out[key] = rule(undefined)
  }
  if (partial && Object.keys(out).length === 0) badRequest('Send at least one field to change')
  return out
}
