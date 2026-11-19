export default defineEventHandler(async (event): Promise<{ ok: true }> => {
  await requireUser(event, ['staff', 'admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Announcement id must be a whole number' })
  }

  const db = serverSupabase()
  const { data: existing, error: lookupError } = await db
    .from('announcements')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (lookupError) {
    console.error('load announcement for delete failed', lookupError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })
  }

  const { error } = await db
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('delete announcement failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not delete the announcement' })
  }

  return { ok: true }
})
