// GET /api/public/status   returns: FloodStatus   (no login needed)
import type { FloodStatus } from '../../../shared/types/api'
 import { loadStatus } from '../../utils/floodStatus'

export default defineEventHandler(async (): Promise<FloodStatus> => {
  const { status } = await loadStatus()
  return status
})