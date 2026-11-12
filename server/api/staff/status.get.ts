// GET /api/staff/status   returns: StaffStatus   (staff or admin; the middleware checks the login)
import type { StaffStatus } from '../../../shared/types/api'
import { loadStatus } from '../../utils/floodStatus'

export default defineEventHandler(async (): Promise<StaffStatus> => {
  const { status, sensor, latest } = await loadStatus()
  if (!sensor) {
    throw createError({ statusCode: 404, statusMessage: 'No active sensor is set up yet' })
  }
 
  const { count, error } = await serverSupabase()
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .is('acknowledged_at', null)
  if (error) {
    console.error('staff status: alerts count failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
 
  return {
    ...status,
    sensor,
    latest_reading: latest,
    unacknowledged_alerts: count ?? 0
  }
})