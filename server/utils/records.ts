// Turns database rows into the shapes the contract promises (announcements, centers,
// contacts, flood reports), so the list routes and the create/edit routes answer the same way.
import type {
  Announcement, AnnouncementCategory, EmergencyContact, EvacuationCenter, FloodReport
} from '../../shared/types/api'

export const dbFail = (what: string, error: unknown): never => {
  console.error(`${what} failed`, error)
  throw createError({ statusCode: 500, statusMessage: 'Database error' })
}

const numberOrNull = (v: unknown): number | null => (v == null ? null : Number(v))
const iso = (v: string): string => new Date(v).toISOString()

/** id -> full name, for the "created by" columns. */
export const profileNames = async (ids: (string | null)[]): Promise<Map<string, string>> => {
  const wanted = [...new Set(ids.filter((id): id is string => id !== null))]
  if (wanted.length === 0) return new Map()
  const { data, error } = await serverSupabase().from('profiles').select('id, full_name').in('id', wanted)
  if (error) return dbFail('profile names', error)
  return new Map((data ?? []).map((p: any) => [p.id as string, p.full_name as string]))
}

// ---------- Announcements ----------
export const ANNOUNCEMENT_COLUMNS = 'id, title, body, category, published_at, created_by, created_at, updated_at'

export const toAnnouncements = async (rows: any[]): Promise<Announcement[]> => {
  const names = await profileNames(rows.map(r => r.created_by ?? null))
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    body: r.body,
    category: r.category as AnnouncementCategory,
    published_at: r.published_at ? iso(r.published_at) : null,
    created_by_name: r.created_by ? names.get(r.created_by) ?? null : null,
    created_at: iso(r.created_at),
    updated_at: iso(r.updated_at)
  }))
}

// ---------- Evacuation centers ----------
export const CENTER_COLUMNS = 'id, name, address, latitude, longitude, capacity, contact_person, contact_number, is_open, notes'

export const toEvacuationCenter = (r: any): EvacuationCenter => ({
  id: r.id,
  name: r.name,
  address: r.address ?? null,
  latitude: numberOrNull(r.latitude),
  longitude: numberOrNull(r.longitude),
  capacity: numberOrNull(r.capacity),
  contact_person: r.contact_person ?? null,
  contact_number: r.contact_number ?? null,
  is_open: r.is_open === true,
  notes: r.notes ?? null
})

// ---------- Emergency contacts ----------
export const CONTACT_COLUMNS = 'id, name, category, number, sort_order, is_active'

export const toEmergencyContact = (r: any): EmergencyContact => ({
  id: r.id,
  name: r.name,
  category: r.category ?? null,
  number: r.number,
  sort_order: Number(r.sort_order),
  is_active: r.is_active === true
})

// ---------- Flood reports ----------
export const FLOOD_REPORT_COLUMNS =
  'id, reported_at, flooded_areas, passable_roads, impassable_roads, families_evacuated, individuals_evacuated, remarks, created_by'

export const toFloodReports = async (rows: any[]): Promise<FloodReport[]> => {
  const names = await profileNames(rows.map(r => r.created_by ?? null))
  return rows.map(r => ({
    id: r.id,
    reported_at: iso(r.reported_at),
    flooded_areas: r.flooded_areas ?? null,
    passable_roads: r.passable_roads ?? null,
    impassable_roads: r.impassable_roads ?? null,
    families_evacuated: Number(r.families_evacuated),
    individuals_evacuated: Number(r.individuals_evacuated),
    remarks: r.remarks ?? null,
    created_by_name: r.created_by ? names.get(r.created_by) ?? null : null
  }))
}
