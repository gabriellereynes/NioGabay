
// Small helpers shared by the API routes (readings now, dashboard later).
import { createHash } from 'node:crypto'
import type { AlertLevel } from '../../shared/types/api'
 
/*export interface AlertLevel {
  id: number
  code: string
  label: string
  level_cm: number
}*/
 
// The sensor's API key is never stored. We store only this SHA-256 fingerprint
// of it, so even someone who can read the database cannot recover the key.
export const hashDeviceKey = (key: string): string =>
  createHash('sha256').update(key).digest('hex')
// Returns the highest alert level the water has reached,
// or null when the water is still below the lowest level (= "normal").
export const pickAlertLevel = (
  levels: AlertLevel[],
  waterLevelCm: number
): AlertLevel | null => {
  let found: AlertLevel | null = null
  for (const level of levels) {
    if (level.level_cm <= waterLevelCm && (!found || level.level_cm > found.level_cm)) {
      found = level
    }
  }
  return found
}
 