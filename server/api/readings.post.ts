// POST /api/readings
// Called by the ESP32 sensor every few seconds.
//
// Request:
//   header  x-api-key: <the sensor's device key>
//   body    { "distance_cm": 182.4 }   <- distance from the sensor down to the water surface
//
// What it does:
//   1. checks the device key
//   2. converts distance -> water level (mount height minus distance)
//   3. saves the reading
//   4. creates an alert when the water crosses UP into a higher level
import { hashDeviceKey, pickAlertLevel, type AlertLevel } from '../utils/flood'
 
// Accepted distance range. Real ultrasonic sensors report 0 (or a tiny number) when the
// echo fails or the target is inside their blind zone, and that is NOT a real reading:
// 0 would be converted to "water as high as the sensor" and raise a false red alert.
// Water coming within 20 cm of a sensor mounted above it would be far past red anyway.
// Check your sensor's datasheet; lower MIN only if its real minimum range is smaller.
const MIN_DISTANCE_CM = 20
const MAX_DISTANCE_CM = 500 // ultrasonic sensors can't measure beyond this anyway
const ALERT_COOLDOWN_MINUTES = 10 // don't repeat the same alert level within this time
const CM_PER_FOOT = 30.48
 
const round1 = (n: number) => Math.round(n * 10) / 10
 
export default defineEventHandler(async (event) => {
  // --- 1. Device key ---------------------------------------------------
  const apiKey = getHeader(event, 'x-api-key')
  if (!apiKey) {
    throw createError({ statusCode: 401, statusMessage: 'Missing API key' })
  }
 
  // --- 2. Validate the body -------------------------------------------
  // We parse the JSON ourselves instead of using readBody(): the Content-Type header does
  // not matter this way. (Arduino's HTTPClient can label a body "form-urlencoded" by
  // default, which would make readBody() misread perfectly good JSON.)
  const raw = await readRawBody(event, 'utf8')
  let body: { distance_cm?: unknown } | null = null
  try {
    body = raw ? JSON.parse(raw) : null
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Body must be valid JSON' })
  }
  const distance = body?.distance_cm
  if (
    typeof distance !== 'number' ||
    !Number.isFinite(distance) ||
    distance < MIN_DISTANCE_CM ||
    distance > MAX_DISTANCE_CM
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `distance_cm must be a number between ${MIN_DISTANCE_CM} and ${MAX_DISTANCE_CM} (anything else is a sensor error)`
    })
  }
 
  const db = serverSupabase()
 
  // --- 3. Find the sensor that owns this key --------------------------
  const { data: sensor, error: sensorError } = await db
    .from('sensors')
    .select('id, mount_height_cm')
    .eq('api_key_hash', hashDeviceKey(apiKey))
    .eq('is_active', true)
    .maybeSingle()
 
  if (sensorError) {
    console.error('readings: sensor lookup failed', sensorError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
  if (!sensor) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid API key' })
  }
  if (sensor.mount_height_cm == null) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Sensor mount height is not set yet (sensors.mount_height_cm)'
    })
  }
 
  // --- 4. Distance -> water level -------------------------------------
  // The sensor hangs above the water and measures DOWN. The farther the
  // water surface, the lower the water. Clamp at 0 so noise can't go negative.
  const distanceCm = round1(distance)
  const waterLevelCm = round1(Math.max(0, Number(sensor.mount_height_cm) - distanceCm))
 
  // --- 5. Load what we need to decide about alerts --------------------
  // (Must happen BEFORE we insert the new reading, so "previous" is really previous.)
  const { data: levelRows, error: levelsError } = await db
    .from('alert_levels')
    .select('id, code, label, level_cm')
    .order('level_cm')
 
  const { data: previous, error: previousError } = await db
    .from('readings')
    .select('water_level_cm')
    .eq('sensor_id', sensor.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()
 
  if (levelsError || previousError) {
    console.error('readings: lookup failed', levelsError ?? previousError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
 
  const levels = (levelRows ?? []) as AlertLevel[]
  const newLevel = pickAlertLevel(levels, waterLevelCm)
  const oldLevel = previous ? pickAlertLevel(levels, Number(previous.water_level_cm)) : null
 
  // --- 6. Save the reading --------------------------------------------
  const { data: reading, error: insertError } = await db
    .from('readings')
    .insert({
      sensor_id: sensor.id,
      distance_cm: distanceCm,
      water_level_cm: waterLevelCm
    })
    .select('id, recorded_at')
    .single()
 
  if (insertError || !reading) {
    console.error('readings: insert failed', insertError)
    throw createError({ statusCode: 500, statusMessage: 'Could not save reading' })
  }
 
  // Remember the sensor is alive (used later to show "sensor offline").
  const { error: seenError } = await db
    .from('sensors')
    .update({ last_seen_at: reading.recorded_at })
    .eq('id', sensor.id)
  if (seenError) console.error('readings: last_seen_at update failed', seenError)
 
  // --- 7. Alert only when the water crosses UP into a higher level -----
  let alertCreated = false
  const escalated = newLevel && (!oldLevel || newLevel.level_cm > oldLevel.level_cm)
 
  if (newLevel && escalated) {
    const since = new Date(Date.now() - ALERT_COOLDOWN_MINUTES * 60_000).toISOString()
 
    // Cooldown: sensor readings jitter, so don't repeat the same alert over and over.
    const { data: recent } = await db
      .from('alerts')
      .select('id')
      .eq('sensor_id', sensor.id)
      .eq('alert_level_id', newLevel.id)
      .gte('triggered_at', since)
      .limit(1)
 
    if (!recent || recent.length === 0) {
      const feet = round1(waterLevelCm / CM_PER_FOOT)
      const { error: alertError } = await db.from('alerts').insert({
        source: 'sensor',
        alert_level_id: newLevel.id,
        sensor_id: sensor.id,
        reading_id: reading.id,
        message: `${newLevel.label}: water level is ${waterLevelCm} cm (${feet} ft).`
      })
      if (alertError) {
        console.error('readings: alert insert failed', alertError)
      } else {
        alertCreated = true
        // TODO (later): send the SMS to subscribers here.
      }
    }
  }
 
  setResponseStatus(event, 201)
  return {
    id: reading.id,
    water_level_cm: waterLevelCm,
    alert_level: newLevel?.code ?? 'normal',
    alert_created: alertCreated
  }
})
 