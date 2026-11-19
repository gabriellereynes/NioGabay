import type { Announcement, AnnouncementCategory, Paged } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<Paged<Announcement>> => {
  await requireUser(event, ['staff', 'admin'])
  const { limit, offset } = readPaging(event)
  const db = serverSupabase()

  const { data, error, count } = await db
    .from('announcements')
    .select('id,title,body,category,published_at,created_by,created_at,updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('staff announcements failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }

  const rows = data ?? []
  const creatorIds = [...new Set(rows.map(row => row.created_by).filter(Boolean))] as string[]
  let nameById = new Map<string, string>()

  if (creatorIds.length > 0) {
    const { data: profiles, error: profilesError } = await db
      .from('profiles')
      .select('id,full_name')
      .in('id', creatorIds)

    if (profilesError) {
      console.error('staff announcements profile lookup failed', profilesError)
      throw createError({ statusCode: 500, statusMessage: 'Database error' })
    }

    nameById = new Map((profiles ?? []).map(profile => [profile.id, profile.full_name]))
  }

  const items: Announcement[] = rows.map(row => ({
    id: Number(row.id),
    title: row.title,
    body: row.body,
    category: row.category as AnnouncementCategory,
    published_at: row.published_at ? new Date(row.published_at).toISOString() : null,
    created_by_name: row.created_by ? nameById.get(row.created_by) ?? null : null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  }))

  return { items, total: count ?? 0 }
})
