// PATCH /api/admin/emergency-contacts/:id   body: any fields of EmergencyContactInput   returns: EmergencyContact   (admin only)
import type { EmergencyContact } from '../../../../../shared/types/api'

export default defineEventHandler(async (event): Promise<EmergencyContact> => {
  await requireUser(event, ['admin'])
  const id = routeInt(event)
  const body = await readObjectBody(event)

  const changes = pickFields(body, {
    name: v => requiredText(v, 'name', 1, 100),
    category: v => optionalText(v, 'category', 50),
    number: v => requiredText(v, 'number', 1, 40),
    sort_order: v => wholeNumber(v, 'sort_order', 0, 10_000),
    is_active: v => requiredBoolean(v, 'is_active')
  }, true)

  const { data, error } = await serverSupabase()
    .from('emergency_contacts').update(changes).eq('id', id).select(CONTACT_COLUMNS).maybeSingle()
  if (error) return dbFail('update emergency contact', error)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Emergency contact not found' })

  return toEmergencyContact(data)
})