// POST /api/auth/logout   returns: { ok: true }
import type { Ok } from '../../../shared/types/api'
 
export default defineEventHandler(async (event): Promise<Ok> => {
  await clearUserSession(event)
  return { ok: true }
})