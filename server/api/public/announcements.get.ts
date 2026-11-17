// GET /api/public/announcements?limit=10   returns: PublicAnnouncement[]   (no login needed)
// Published announcements only, newest first. Drafts (published_at = null) are never returned.
import type { AnnouncementCategory, PublicAnnouncement } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<PublicAnnouncement[]> => {
  const limit = readLimit(event, 10, 50)

  // "published_at <= now" also drops drafts, because a missing date never matches.
  const { data, error } = await serverSupabase()
    .from('announcements')
    .select('id, title, body, category, published_at')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('public announcements failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }

  return (data ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    category: a.category as AnnouncementCategory,
    published_at: new Date(a.published_at).toISOString()
  }))
})
