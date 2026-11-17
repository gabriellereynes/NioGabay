// POST /api/admin/evacuation-centers   body: EvacuationCenterInput   returns: EvacuationCenter (201)   (admin only)
// To list centers, use GET /api/public/evacuation-centers.
import type { EvacuationCenter } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<EvacuationCenter> => {
  await requireUser(event, ['admin'])
  const body = await readObjectBody(event)

  const fields = pickFields(body, {
    name: v => requiredText(v, 'name', 1, 120),
    address: v => optionalText(v, 'address', 300),
    latitude: v => optionalCoordinate(v, 'latitude', -90, 90),
    longitude: v => optionalCoordinate(v, 'longitude', -180, 180),
    capacity: v => optionalWholeNumber(v, 'capacity', 0, 100_000),
    contact_person: v => optionalText(v, 'contact_person', 100),
    contact_number: v => optionalText(v, 'contact_number', 40),
    is_open: v => requiredBoolean(v, 'is_open', false),
    notes: v => optionalText(v, 'notes', 1000)
  }, false)

  const { data, error } = await serverSupabase()
    .from('evacuation_centers').insert(fields).select(CENTER_COLUMNS).single()
  if (error || !data) return dbFail('create evacuation center', error)

  setResponseStatus(event, 201)
  return toEvacuationCenter(data)
})