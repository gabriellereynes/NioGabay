// Reads ?limit= and ?offset= from the URL for list routes (contract rule 8).
// Default limit 20, maximum 100. A limit above the maximum is lowered to the maximum;
// anything that is not a whole number is rejected with 400.
import type { H3Event } from 'h3'

const readWholeNumber = (value: unknown, name: string, fallback: number, min: number): number => {
  if (value === undefined || value === '') return fallback
  const n = Number(Array.isArray(value) ? value[0] : value)
  if (!Number.isInteger(n) || n < min) {
    throw createError({
      statusCode: 400,
      statusMessage: `${name} must be a whole number, ${min} or more`
    })
  }
  return n
}

export const readLimit = (event: H3Event, defaultLimit: number, maxLimit: number): number =>
  Math.min(readWholeNumber(getQuery(event).limit, 'limit', defaultLimit, 1), maxLimit)

export const readPaging = (event: H3Event, defaultLimit = 20, maxLimit = 100) => ({
  limit: readLimit(event, defaultLimit, maxLimit),
  offset: readWholeNumber(getQuery(event).offset, 'offset', 0, 0)
})