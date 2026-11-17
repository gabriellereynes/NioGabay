// GET /api/admin/emergency-contacts   returns: EmergencyContact[]   (admin only)
// Includes inactive contacts, in the order set by sort_order. Residents only see active ones
// (GET /api/public/emergency-contacts).
import type { EmergencyContact } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<EmergencyContact[]> => {
  await requireUser(event, ['admin'])

  const { data, error } = await serverSupabase()
    .from('emergency_contacts')
    .select(CONTACT_COLUMNS)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) return dbFail('admin emergency contacts', error)

  return (data ?? []).map(toEmergencyContact)
})