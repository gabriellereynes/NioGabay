// GET /api/staff/alert-levels   returns: AlertLevel[]   (staff or admin)
// The three active thresholds, lowest first.
import { loadAlertLevels } from '~~/server/utils/floodStatus'
import type { AlertLevel } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<AlertLevel[]> => {
  await requireUser(event, ['staff', 'admin'])
  return loadAlertLevels()
})
