// GET /api/auth/me   returns: Me   (401 when nobody is logged in)
import type { Me } from '../../../shared/types/api'
 
export default defineEventHandler(async (event): Promise<Me> => {
  const me = await getCurrentUser(event)
  if (!me) {
    throw createError({ statusCode: 401, statusMessage: 'Not logged in' })
  }
  return me
})