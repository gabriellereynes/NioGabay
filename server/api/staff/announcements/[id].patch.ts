import type { Announcement, AnnouncementCategory, AnnouncementPatch } from '../../../../shared/types/api'

const CATEGORIES = ['flood', 'evacuation', 'advisory', 'general']

export default defineEventHandler(async (event): Promise<Announcement> => {
  await requireUser(event, ['staff', 'admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Announcement id must be a whole number' })
  }

  const body = await readBody(event) as Partial<AnnouncementPatch> | null
  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  const patch: Record<string, unknown> = {}

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'title must be 1 to 150 characters' })
    }
    const title = body.title.trim()
    if (title.length < 1 || title.length > 150) {
      throw createError({ statusCode: 400, statusMessage: 'title must be 1 to 150 characters' })
    }
    patch.title = title
  }

  if (body.body !== undefined) {
    if (typeof body.body !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'body must be 1 to 5000 characters' })
    }
    const message = body.body.trim()
    if (message.length < 1 || message.length > 5000) {
      throw createError({ statusCode: 400, statusMessage: 'body must be 1 to 5000 characters' })
    }
    patch.body = message
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !CATEGORIES.includes(body.category)) {
      throw createError({ statusCode: 400, statusMessage: 'category must be flood, evacuation, advisory or general' })
    }
    patch.category = body.category
  }

  if (body.publish !== undefined) {
    if (typeof body.publish !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'publish must be true or false' })
    }

    const db = serverSupabase()
    const { data: current, error: currentError } = await db
      .from('announcements')
      .select('published_at')
      .eq('id', id)
      .maybeSingle()

    if (currentError) {
      console.error('load announcement for update failed', currentError)
      throw createError({ statusCode: 500, statusMessage: 'Database error' })
    }
    if (!current) {
      throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })
    }

    patch.published_at = body.publish
      ? (current.published_at ? current.published_at : new Date().toISOString())
      : null
  }

  const db = serverSupabase()
  const { data: row, error } = await db
    .from('announcements')
    .update(patch)
    .eq('id', id)
    .select('id,title,body,category,published_at,created_by,created_at,updated_at')
    .maybeSingle()

  if (error) {
    console.error('update announcement failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Could not update the announcement' })
  }
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })
  }

  let createdByName: string | null = null
  if (row.created_by) {
    const { data: profile } = await db
      .from('profiles')
      .select('full_name')
      .eq('id', row.created_by)
      .maybeSingle()
    createdByName = profile?.full_name ?? null
  }

  return {
    id: Number(row.id),
    title: row.title,
    body: row.body,
    category: row.category as AnnouncementCategory,
    published_at: row.published_at ? new Date(row.published_at).toISOString() : null,
    created_by_name: createdByName,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  }
})
