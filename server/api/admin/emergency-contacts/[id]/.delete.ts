// DELETE /api/admin/emergency-contacts/:id   returns: { ok: true }   (admin only)
// Tip for the screen: ask "Are you sure?" first. To only hide a contact from residents, set is_active to false instead.
import type { Ok } from '../../../../../shared/types/api'

export default defineEventHandler(async (event): Promise<Ok> => {
  await requireUser(event, ['admin'])
  const id = routeInt(event)

  const { data, error } = await serverSupabase().from('emergency_contacts').delete().eq('id', id).select('id')
  if (error) return dbFail('delete emergency contact', error)
  if (!data || data.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Emergency contact not found' })
  }
  return { ok: true }
})