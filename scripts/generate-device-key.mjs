// Generates a device API key for the sensor.
// Run:  node scripts/generate-device-key.mjs
//
// The KEY is shown only once. Keep it for the ESP32 (and for the simulator).
// Only the HASH goes into the database (paste the printed SQL into the Supabase SQL Editor).
import { randomBytes, createHash } from 'node:crypto'

const key = 'ngk_' + randomBytes(32).toString('hex')
const hash = createHash('sha256').update(key).digest('hex')

console.log(`
=====================================================
 DEVICE KEY  (save it now; it cannot be shown again)
=====================================================
${key}

=====================================================
 Paste this into Supabase -> SQL Editor -> Run
=====================================================
update public.sensors
set api_key_hash = '${hash}'
where name = 'NioGabay Sensor 1';

-- The server needs the sensor's mount height to turn distance into water level.
-- 250 is a PLACEHOLDER for testing. Replace it with the real measured value
-- (distance in cm from the sensor face do wn to the ground/riverbed) once installed.
update public.sensors
set mount_height_cm = 250
where name = 'NioGabay Sensor 1';
`)
