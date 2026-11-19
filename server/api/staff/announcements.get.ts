// GET /api/staff/announcements?limit=20&offset=0   returns: Paged<Announcement>   (staff or admin)
// Everything including drafts (published_at is null), newest first.
import type { Announcement, Paged } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<Paged<Announcement>> => {
  await requireUser(event, ['staff', 'admin'])
  const { limit, offset } = readPaging(event)

  const { data, error, count } = await serverSupabase()
    .from('announcements')
    .select(ANNOUNCEMENT_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return dbFail('staff announcements', error)

  return { items: await toAnnouncements(data ?? []), total: count ?? 0 }
})
