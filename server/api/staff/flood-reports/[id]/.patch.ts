// PATCH /api/staff/flood-reports/:id   body: FloodReportPatch   returns: FloodReport   (staff or admin)
// Send only the fields to change. Reports cannot be deleted, so the records stay complete.
import type { FloodReport } from '../../../../../shared/types/api'

export default defineEventHandler(async (event): Promise<FloodReport> => {
  await requireUser(event, ['staff', 'admin'])
  const id = routeInt(event)
  const body = await readObjectBody(event)

  const changes = pickFields(body, {
    reported_at: v => isoDateTime(v, 'reported_at'),
    flooded_areas: v => optionalText(v, 'flooded_areas', 2000),
    passable_roads: v => optionalText(v, 'passable_roads', 2000),
    impassable_roads: v => optionalText(v, 'impassable_roads', 2000),
    families_evacuated: v => wholeNumber(v, 'families_evacuated', 0, 1_000_000),
    individuals_evacuated: v => wholeNumber(v, 'individuals_evacuated', 0, 1_000_000),
    remarks: v => optionalText(v, 'remarks', 2000)
  }, true)

  const { data, error } = await serverSupabase()
    .from('flood_reports').update(changes).eq('id', id).select(FLOOD_REPORT_COLUMNS).maybeSingle()
  if (error) return dbFail('update flood report', error)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Flood report not found' })

  const updated = (await toFloodReports([data]))[0]
  if (!updated) return dbFail('update flood report', 'no row returned')
  return updated
})
