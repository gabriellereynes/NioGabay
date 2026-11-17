// GET /api/staff/flood-reports?limit=20&offset=0   returns: Paged<FloodReport>   (staff or admin)
// Newest first.
import type { FloodReport, Paged } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<Paged<FloodReport>> => {
  await requireUser(event, ['staff', 'admin'])
  const { limit, offset } = readPaging(event)

  const { data, error, count } = await serverSupabase()
    .from('flood_reports')
    .select(FLOOD_REPORT_COLUMNS, { count: 'exact' })
    .order('reported_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return dbFail('staff flood reports', error)

  return { items: await toFloodReports(data ?? []), total: count ?? 0 }
})