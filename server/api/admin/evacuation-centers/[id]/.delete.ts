// DELETE /api/admin/evacuation-centers/:id   returns: { ok: true }   (admin only)
// Tip for the screen: ask "Are you sure?" first. To only hide a center from evacuees, set is_open to false instead.
import type { Ok } from '../../../../../shared/types/api'

export default defineEventHandler(async (event): Promise<Ok> => {
  await requireUser(event, ['admin'])
  const id = routeInt(event)

  const { data, error } = await serverSupabase().from('evacuation_centers').delete().eq('id', id).select('id')
  if (error) return dbFail('delete evacuation center', error)
  if (!data || data.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Evacuation center not found' })
  }
  return { ok: true }
})