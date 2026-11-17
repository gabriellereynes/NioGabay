// PATCH /api/staff/announcements/:id   body: AnnouncementPatch   returns: Announcement   (staff or admin)
// Send only the fields to change. publish: true publishes a draft (an already published one keeps
// its original date), publish: false takes it back to a draft.
import type { Announcement, AnnouncementCategory } from '../../../../../shared/types/api'

const CATEGORIES: readonly AnnouncementCategory[] = ['flood', 'evacuation', 'advisory', 'general']

export default defineEventHandler(async (event): Promise<Announcement> => {
  await requireUser(event, ['staff', 'admin'])
  const id = routeInt(event)
  const body = await readObjectBody(event)

  const changes = pickFields(body, {
    title: v => requiredText(v, 'title', 1, 150),
    body: v => requiredText(v, 'body', 1, 5000),
    category: v => oneOfValues(v, 'category', CATEGORIES),
    publish: v => requiredBoolean(v, 'publish')
  }, true)

  const db = serverSupabase()
  const { data: existing, error: findError } = await db
    .from('announcements').select('id, published_at').eq('id', id).maybeSingle()
  if (findError) return dbFail('find announcement', findError)
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })

  const { publish, ...columns } = changes
  const patch: Record<string, unknown> = { ...columns }
  if (publish === true) patch.published_at = existing.published_at ?? new Date().toISOString()
  if (publish === false) patch.published_at = null

  const { data, error } = await db
    .from('announcements').update(patch).eq('id', id).select(ANNOUNCEMENT_COLUMNS).maybeSingle()
  if (error) return dbFail('update announcement', error)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })

  const updated = (await toAnnouncements([data]))[0]
  if (!updated) return dbFail('update announcement', 'no row returned')
  return updated
})
