// GET /api/staff/readings?range=24h   returns: ReadingsResponse   (staff or admin)
// range is 24h (default), 7d, 30d or 90d.
import type { ReadingRange, ReadingsResponse } from '../../../shared/types/api'
 
const RANGES: ReadingRange[] = ['24h', '7d', '30d', '90d']
 
export default defineEventHandler(async (event): Promise<ReadingsResponse> => {
  const asked = getQuery(event).range
  const range = (asked ?? '24h') as ReadingRange
  if (typeof range !== 'string' || !RANGES.includes(range)) {
    throw createError({ statusCode: 400, statusMessage: 'range must be 24h, 7d, 30d or 90d' })
  }
  return loadSeries(range)
})