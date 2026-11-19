// DELETE /api/staff/announcements/:id   returns: { ok: true }   (staff or admin)
import type { Ok } from '../../../../../shared/types/api'

export default defineEventHandler(async (event): Promise<Ok> => {
  await requireUser(event, ['staff', 'admin'])
  const id = routeInt(event)

  const { data, error } = await serverSupabase().from('announcements').delete().eq('id', id).select('id')
  if (error) return dbFail('delete announcement', error)
  if (!data || data.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })
  }
  return { ok: true }
})
