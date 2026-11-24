// Shared by the alert routes: turns rows of the `alerts` table into the AlertRecord the
// contract promises (level code and label, water level, and the names of the people).
// It does a few plain queries and joins them here, instead of relying on database embeds.
import type { AlertRecord } from '../../shared/types/api'

/** Use this in every `.select(...)` on the alerts table, so all routes read the same columns. */
export const ALERT_COLUMNS =
  'id, source, alert_level_id, reading_id, message, created_by, triggered_at, acknowledged_by, acknowledged_at'

export interface AlertRow {
  id: number
  source: 'sensor' | 'manual'
  alert_level_id: number | null
  reading_id: number | null
  message: string
  created_by: string | null
  triggered_at: string
  acknowledged_by: string | null
  acknowledged_at: string | null
}

const unique = <T>(values: (T | null)[]): T[] => [...new Set(values.filter((v): v is T => v !== null))]

const fail = (what: string, error: unknown): never => {
  console.error(`alerts: ${what} lookup failed`, error)
  throw createError({ statusCode: 500, statusMessage: 'Database error' })
}

export async function hydrateAlerts(rows: AlertRow[]): Promise<AlertRecord[]> {
  if (rows.length === 0) return []
  const db = serverSupabase()

  const levelIds = unique(rows.map(r => r.alert_level_id))
  const readingIds = unique(rows.map(r => r.reading_id))
  const profileIds = unique(rows.flatMap(r => [r.created_by, r.acknowledged_by]))

  const [levels, readings, profiles] = await Promise.all([
    levelIds.length ? db.from('alert_levels').select('id, code, label').in('id', levelIds) : { data: [], error: null },
    readingIds.length ? db.from('readings').select('id, water_level_cm').in('id', readingIds) : { data: [], error: null },
    profileIds.length ? db.from('profiles').select('id, full_name').in('id', profileIds) : { data: [], error: null }
  ])
  if (levels.error) fail('alert level', levels.error)
  if (readings.error) fail('reading', readings.error)
  if (profiles.error) fail('profile', profiles.error)

  const levelById = new Map<number, { code: string; label: string }>((levels.data ?? []).map((l: any) => [l.id, l]))
  const readingById = new Map<number, number>((readings.data ?? []).map((r: any) => [r.id, Number(r.water_level_cm)]))
  const nameById = new Map<string, string>((profiles.data ?? []).map((p: any) => [p.id, p.full_name]))

  return rows.map((r) => {
    const level = r.alert_level_id === null ? undefined : levelById.get(r.alert_level_id)
    return {
      id: r.id,
      source: r.source,
      alert_level: (level?.code ?? null) as AlertRecord['alert_level'],
      alert_label: level?.label ?? null,
      message: r.message,
      water_level_cm: r.reading_id === null ? null : readingById.get(r.reading_id) ?? null,
      triggered_at: new Date(r.triggered_at).toISOString(),
      created_by_name: r.created_by === null ? null : nameById.get(r.created_by) ?? null,
      acknowledged_by_name: r.acknowledged_by === null ? null : nameById.get(r.acknowledged_by) ?? null,
      acknowledged_at: r.acknowledged_at === null ? null : new Date(r.acknowledged_at).toISOString()
    }
  })
}
