// PATCH /api/admin/evacuation-centers/:id   body: any fields of EvacuationCenterInput   returns: EvacuationCenter   (admin only)
import type { EvacuationCenter } from '../../../../../shared/types/api'

export default defineEventHandler(async (event): Promise<EvacuationCenter> => {
  await requireUser(event, ['admin'])
  const id = routeInt(event)
  const body = await readObjectBody(event)

  const changes = pickFields(body, {
    name: v => requiredText(v, 'name', 1, 120),
    address: v => optionalText(v, 'address', 300),
    latitude: v => optionalCoordinate(v, 'latitude', -90, 90),
    longitude: v => optionalCoordinate(v, 'longitude', -180, 180),
    capacity: v => optionalWholeNumber(v, 'capacity', 0, 100_000),
    contact_person: v => optionalText(v, 'contact_person', 100),
    contact_number: v => optionalText(v, 'contact_number', 40),
    is_open: v => requiredBoolean(v, 'is_open'),
    notes: v => optionalText(v, 'notes', 1000)
  }, true)

  const { data, error } = await serverSupabase()
    .from('evacuation_centers').update(changes).eq('id', id).select(CENTER_COLUMNS).maybeSingle()
  if (error) return dbFail('update evacuation center', error)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Evacuation center not found' })

  return toEvacuationCenter(data)
})