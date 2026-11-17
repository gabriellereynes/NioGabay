// GET /api/staff/alerts?limit=20&offset=0   returns: Paged<AlertRecord>   (staff or admin)
// Newest first.
import type { AlertRecord, Paged } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<Paged<AlertRecord>> => {
  await requireUser(event, ['staff', 'admin'])
  const { limit, offset } = readPaging(event)

  const { data, error, count } = await serverSupabase()
    .from('alerts')
    .select(ALERT_COLUMNS, { count: 'exact' })
    .order('triggered_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('staff alerts failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }

  return { items: await hydrateAlerts((data ?? []) as AlertRow[]), total: count ?? 0 }
})
