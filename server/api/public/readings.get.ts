// GET /api/public/readings   returns: ReadingsResponse   (no login needed)
// Public history is always the last 24 hours, whatever the caller asks for.
import type { ReadingsResponse } from '../../../shared/types/api'
 
export default defineEventHandler(async (): Promise<ReadingsResponse> => {
  return loadSeries('24h')
})
 