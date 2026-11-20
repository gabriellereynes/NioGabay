// POST /api/staff/announcements   body: AnnouncementInput   returns: Announcement (201)   (staff or admin)
// publish: true publishes now, false (or left out) saves a draft.
import type { Announcement, AnnouncementCategory } from '../../../shared/types/api'

const CATEGORIES: readonly AnnouncementCategory[] = ['flood', 'evacuation', 'advisory', 'general']

export default defineEventHandler(async (event): Promise<Announcement> => {
  const me = await requireUser(event, ['staff', 'admin'])
  const body = await readObjectBody(event)

  const fields = pickFields(body, {
    title: v => requiredText(v, 'title', 1, 150),
    body: v => requiredText(v, 'body', 1, 5000),
    category: v => oneOfValues(v, 'category', CATEGORIES)
  }, false)
  const publish = requiredBoolean(body.publish, 'publish', false)

  const { data, error } = await serverSupabase()
    .from('announcements')
    .insert({ ...fields, published_at: publish ? new Date().toISOString() : null, created_by: me.id })
    .select(ANNOUNCEMENT_COLUMNS)
    .single()
  if (error || !data) return dbFail('create announcement', error)

  const created = (await toAnnouncements([data]))[0]
  if (!created) return dbFail('create announcement', 'no row returned')

  setResponseStatus(event, 201)
  return created
})
