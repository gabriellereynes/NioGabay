// Pretends to be the ESP32 so we can test the system without hardware.
// Needs Node 18+ (built-in fetch). Start the Nuxt dev server first (npm run dev).
//
// Examples:
//   node scripts/simulate-sensor.mjs --key=ngk_xxx                  rising-then-falling flood
//   node scripts/simulate-sensor.mjs --key=ngk_xxx --level=95       one reading: water 95 cm deep
//   node scripts/simulate-sensor.mjs --key=ngk_xxx --distance=180   one raw distance reading
//
// Options:
//   --key=       the device key (or set the DEVICE_API_KEY environment variable)
//   --url=       default http://localhost:3000
//   --mount=     sensor mount height in cm; must match the database (default 250)
//   --interval=  seconds between readings in the flood scenario (default 2)

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [name, value] = arg.replace(/^--/, '').split('=')
    return [name, value ?? true]
  })
)

const endpoint = (args.url ?? 'http://localhost:3000') + '/api/readings'
const key = args.key ?? process.env.DEVICE_API_KEY
const mount = Number(args.mount ?? 250)
const intervalMs = Number(args.interval ?? 2) * 1000

if (!key) {
  console.error('No device key. Use --key=ngk_... or set DEVICE_API_KEY.')
  process.exit(1)
}

const send = async (distanceCm) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({ distance_cm: distanceCm })
  })
  const text = await res.text()
  console.log(`distance ${String(distanceCm).padStart(6)} cm -> HTTP ${res.status}  ${text}`)
}

if (args.distance !== undefined) {
  await send(Number(args.distance))
} else if (args.level !== undefined) {
  await send(mount - Number(args.level))
} else {
  // Water depth in cm over time. Crosses yellow (30.5), evacuation (61),
  // orange (91.4) and red (121.9), then drains.
  const waterLevels = [5, 20, 32, 45, 62, 75, 92, 105, 123, 110, 85, 60, 30, 10]
  for (const level of waterLevels) {
    await send(mount - level)
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}
