// POST /api/staff/alerts/:id/acknowledge   returns: AlertRecord   (staff or admin)
// Marks the alert as seen by the logged-in person. No body.
// If somebody already acknowledged it, the first acknowledgement is kept and returned unchanged.
import type { AlertRecord } from '../../../../../shared/types/api'

export default defineEventHandler(async (event): Promise<AlertRecord> => {
  const me = await requireUser(event, ['staff', 'admin'])

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Alert id must be a whole number' })
  }

  const db = serverSupabase()

  // Only changes the row if nobody has acknowledged it yet, so two people clicking together are safe.
  const { error: updateError } = await db
    .from('alerts')
    .update({ acknowledged_by: me.id, acknowledged_at: new Date().toISOString() })
    .eq('id', id)
    .is('acknowledged_at', null)
  if (updateError) {
    console.error('acknowledge failed', updateError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }

  const { data: row, error } = await db.from('alerts').select(ALERT_COLUMNS).eq('id', id).maybeSingle()
  if (error) {
    console.error('acknowledge: reload failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Alert not found' })
  }

  const record = (await hydrateAlerts([row as AlertRow]))[0]
  if (!record) {
    throw createError({ statusCode: 500, statusMessage: 'Could not load the alert' })
  }
  return record
})
