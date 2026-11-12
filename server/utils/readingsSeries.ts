// Shared by GET /api/public/readings and GET /api/staff/readings.
// Returns the chart points for one time range (highest level per time slice).
import type { ReadingRange, ReadingsResponse } from '../../shared/types/api'
 
export const RANGE_SECONDS: Record<ReadingRange, number> = {
  '24h': 24 * 3600,
  '7d': 7 * 24 * 3600,
  '30d': 30 * 24 * 3600,
  '90d': 90 * 24 * 3600
}
 
const TARGET_POINTS = 290 // leaves room for the partial slices at each end (limit is 300)
 
/** Slice size in seconds: range / 290, rounded UP to a whole minute (the SQL function needs >= 60). */
export const bucketSeconds = (range: ReadingRange): number =>
  Math.ceil(RANGE_SECONDS[range] / TARGET_POINTS / 60) * 60
 
export async function loadSeries(range: ReadingRange): Promise<ReadingsResponse> {
  const db = serverSupabase()
 
  const { data: sensor, error: sensorError } = await db
    .from('sensors')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (sensorError) {
    console.error('series: sensors failed', sensorError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
  if (!sensor) return { range, points: [] }
 
  const from = new Date(Date.now() - RANGE_SECONDS[range] * 1000).toISOString()
  const { data, error } = await db.rpc('reading_series', {
    p_sensor_id: sensor.id,
    p_from: from,
    p_bucket_seconds: bucketSeconds(range)
  })
  if (error) {
    console.error('series: reading_series failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
 
  return {
    range,
    points: (data ?? []).map((p: any) => ({
      t: new Date(p.t).toISOString(),
      water_level_cm: Number(p.water_level_cm)
    }))
  }
}