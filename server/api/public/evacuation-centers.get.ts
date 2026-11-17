// GET /api/public/evacuation-centers   returns: EvacuationCenter[]   (no login needed)
// All centers, open ones first, then by name.
import type { EvacuationCenter } from '../../../shared/types/api'

const numberOrNull = (v: unknown): number | null => (v == null ? null : Number(v))

export default defineEventHandler(async (): Promise<EvacuationCenter[]> => {
  const { data, error } = await serverSupabase()
    .from('evacuation_centers')
    .select('id, name, address, latitude, longitude, capacity, contact_person, contact_number, is_open, notes')
    .order('is_open', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    console.error('public evacuation centers failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    address: c.address ?? null,
    latitude: numberOrNull(c.latitude),
    longitude: numberOrNull(c.longitude),
    capacity: numberOrNull(c.capacity),
    contact_person: c.contact_person ?? null,
    contact_number: c.contact_number ?? null,
    is_open: c.is_open === true,
    notes: c.notes ?? null
  }))
})
