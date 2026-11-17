// POST /api/admin/emergency-contacts   body: EmergencyContactInput   returns: EmergencyContact (201)   (admin only)
import type { EmergencyContact } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<EmergencyContact> => {
  await requireUser(event, ['admin'])
  const body = await readObjectBody(event)

  const fields = pickFields(body, {
    name: v => requiredText(v, 'name', 1, 100),
    category: v => optionalText(v, 'category', 50),
    number: v => requiredText(v, 'number', 1, 40),
    sort_order: v => (v === undefined ? 0 : wholeNumber(v, 'sort_order', 0, 10_000)),
    is_active: v => requiredBoolean(v, 'is_active', true)
  }, false)

  const { data, error } = await serverSupabase()
    .from('emergency_contacts').insert(fields).select(CONTACT_COLUMNS).single()
  if (error || !data) return dbFail('create emergency contact', error)

  setResponseStatus(event, 201)
  return toEmergencyContact(data)
})