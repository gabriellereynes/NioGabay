import type { Announcement, AnnouncementCategory, AnnouncementInput } from '../../../shared/types/api'

const CATEGORIES = ['flood', 'evacuation', 'advisory', 'general']

export default defineEventHandler(async (event): Promise<Announcement> => {
  const me = await requireUser(event, ['staff', 'admin'])
  const body = await readBody(event) as Partial<Record<keyof AnnouncementInput, unknown>> | null

  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const message = typeof body?.body === 'string' ? body.body.trim() : ''
  if (title.length < 1 || title.length > 150) {
    throw createError({ statusCode: 400, statusMessage: 'title must be 1 to 150 characters' })
  }
  if (message.length < 1 || message.length > 5000) {
    throw createError({ statusCode: 400, statusMessage: 'body must be 1 to 5000 characters' })
  }
  if (typeof body?.category !== 'string' || !CATEGORIES.includes(body.category)) {
    throw createError({ statusCode: 400, statusMessage: 'category must be flood, evacuation, advisory or general' })
  }

  const publish = body?.publish === undefined ? false : body.publish
  if (typeof publish !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'publish must be true or false' })
  }

  const db = serverSupabase()
  const { data: row, error } = await db
    .from('announcements')
    .insert({
      title,
      body: message,
      category: body.category,
      published_at: publish ? new Date().toISOString() : null,
      created_by: me.id
    })
    .select('id,title,body,category,published_at,created_by,created_at,updated_at')
    .single()

  if (error || !row) {
    console.error('create announcement failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not save the announcement' })
  }

  setResponseStatus(event, 201)
  return {
    id: Number(row.id),
    title: row.title,
    body: row.body,
    category: row.category as AnnouncementCategory,
    published_at: row.published_at ? new Date(row.published_at).toISOString() : null,
    created_by_name: me.full_name,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  }
})
