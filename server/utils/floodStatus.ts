// Shared by GET /api/public/status and GET /api/staff/status.
// Builds the "current flood status" from the database. Server-side only.
import type { AlertLevel, AlertLevelCode, FloodStatus } from '../../shared/types/api'
 
const CM_PER_FOOT = 30.48
export const OFFLINE_AFTER_MINUTES = 5 // no reading for this long = sensor offline
 
const round1 = (n: number) => Math.round(n * 10) / 10
 
export interface SensorRow {
  id: string
  name: string
  location_description: string | null
  mount_height_cm: number | null
  is_active: boolean
}
 
export interface LatestReading {
  id: number
  distance_cm: number
  water_level_cm: number
  recorded_at: string
}
 
export interface StatusParts {
  status: FloodStatus
  sensor: SensorRow | null
  latest: LatestReading | null
}
 
// Same rule as the sensor endpoint: the highest level the water has reached, or null.
const pickLevel = (levels: AlertLevel[], cm: number): AlertLevel | null => {
  let found: AlertLevel | null = null
  for (const l of levels) {
    if (l.level_cm <= cm && (!found || l.level_cm > found.level_cm)) found = l
  }
  return found
}
 
/** We have one sensor for now: the oldest active one. */
export async function loadStatus(): Promise<StatusParts> {
  const db = serverSupabase()
 
  const { data: levelRows, error: levelsError } = await db
    .from('alert_levels')
    .select('id, code, label, level_ft, level_cm, description')
    .order('level_cm')
  if (levelsError) {
    console.error('status: alert_levels failed', levelsError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
  const levels: AlertLevel[] = (levelRows ?? []).map((l: any) => ({
    id: l.id,
    code: l.code,
    label: l.label,
    level_ft: Number(l.level_ft),
    level_cm: Number(l.level_cm),
    description: l.description ?? null
  }))
  levels.sort((a, b) => a.level_cm - b.level_cm) // lowest first, as the contract promises
 
  const { data: sensorRow, error: sensorError } = await db
    .from('sensors')
    .select('id, name, location_description, mount_height_cm, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (sensorError) {
    console.error('status: sensors failed', sensorError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
  const sensor: SensorRow | null = sensorRow
    ? {
        id: sensorRow.id,
        name: sensorRow.name,
        location_description: sensorRow.location_description ?? null,
        mount_height_cm: sensorRow.mount_height_cm == null ? null : Number(sensorRow.mount_height_cm),
        is_active: sensorRow.is_active
      }
    : null
 
  let latest: LatestReading | null = null
  if (sensor) {
    const { data: row, error: readingError } = await db
      .from('readings')
      .select('id, distance_cm, water_level_cm, recorded_at')
      .eq('sensor_id', sensor.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (readingError) {
      console.error('status: readings failed', readingError)
      throw createError({ statusCode: 500, statusMessage: 'Database error' })
    }
    if (row) {
      latest = {
        id: row.id,
        distance_cm: Number(row.distance_cm),
        water_level_cm: Number(row.water_level_cm),
        recorded_at: new Date(row.recorded_at).toISOString()
      }
    }
  }
 
  let status: FloodStatus
  if (!latest) {
    status = {
      sensor_online: false,
      last_reading_at: null,
      water_level_cm: null,
      water_level_ft: null,
      alert_level: 'normal',
      alert_label: 'No data',
      levels
    }
  } else {
    const level = pickLevel(levels, latest.water_level_cm)
    const ageMs = Date.now() - new Date(latest.recorded_at).getTime()
    status = {
      sensor_online: ageMs <= OFFLINE_AFTER_MINUTES * 60_000,
      last_reading_at: latest.recorded_at,
      water_level_cm: latest.water_level_cm,
      water_level_ft: round1(latest.water_level_cm / CM_PER_FOOT),
      alert_level: (level?.code ?? 'normal') as AlertLevelCode,
      alert_label: level?.label ?? 'Normal',
      levels
    }
  }
 
  return { status, sensor, latest }
}