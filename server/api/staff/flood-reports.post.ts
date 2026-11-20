// POST /api/staff/flood-reports   body: FloodReportInput   returns: FloodReport (201)   (staff or admin)
// reported_at is optional and defaults to now.
import type { FloodReport } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<FloodReport> => {
  const me = await requireUser(event, ['staff', 'admin'])
  const body = await readObjectBody(event)

  const fields = pickFields(body, {
    flooded_areas: v => optionalText(v, 'flooded_areas', 2000),
    passable_roads: v => optionalText(v, 'passable_roads', 2000),
    impassable_roads: v => optionalText(v, 'impassable_roads', 2000),
    families_evacuated: v => wholeNumber(v, 'families_evacuated', 0, 1_000_000),
    individuals_evacuated: v => wholeNumber(v, 'individuals_evacuated', 0, 1_000_000),
    remarks: v => optionalText(v, 'remarks', 2000)
  }, false)
  const reportedAt = body.reported_at === undefined ? new Date().toISOString() : isoDateTime(body.reported_at, 'reported_at')

  const { data, error } = await serverSupabase()
    .from('flood_reports')
    .insert({ ...fields, reported_at: reportedAt, created_by: me.id })
    .select(FLOOD_REPORT_COLUMNS)
    .single()
  if (error || !data) return dbFail('create flood report', error)

  const created = (await toFloodReports([data]))[0]
  if (!created) return dbFail('create flood report', 'no row returned')

  setResponseStatus(event, 201)
  return created
})
