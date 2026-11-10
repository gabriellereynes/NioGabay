// Helpers for "who is calling, and are they allowed?"
//
// The login cookie only remembers WHO you are (id and email). Your role and whether your
// account is still active are read from the database on every request, so deactivating
// someone or changing their role takes effect immediately, with no need to wait for the
// cookie to expire.
import type { H3Event } from 'h3'
import type { Me, Role } from '../../shared/types/api'
 
/** The logged-in person for this request, or null (not logged in, or account deactivated). */
export const getCurrentUser = async (event: H3Event): Promise<Me | null> => {
  // Look it up once per request, even if both the middleware and the route ask.
  if (event.context.me !== undefined) return event.context.me as Me | null
 
  const session = await getUserSession(event)
  const id = session.user?.id
  if (!id) {
    event.context.me = null
    return null
  }
 
  const { data: profile, error } = await serverSupabase()
    .from('profiles')
    .select('id, full_name, position_title, role, is_active')
    .eq('id', id)
    .maybeSingle()
 
  if (error) {
    console.error('auth: profile lookup failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
 
  if (!profile || !profile.is_active) {
    await clearUserSession(event) // deactivated or deleted: treat as logged out
    event.context.me = null
    return null
  }
 
  const me: Me = {
    id: profile.id,
    email: session.user!.email,
    full_name: profile.full_name,
    position_title: profile.position_title,
    role: profile.role as Role
  }
  event.context.me = me
  return me
}
 
/**
 * Use at the top of a route that needs a login:
 *   const me = await requireUser(event, ['admin'])        // admins only
 *   const me = await requireUser(event, ['staff', 'admin']) // staff or admin
 * Throws 401 when nobody is logged in and 403 when the role is not allowed.
 */
export const requireUser = async (event: H3Event, roles: Role[]): Promise<Me> => {
  const me = await getCurrentUser(event)
  if (!me) {
    throw createError({ statusCode: 401, statusMessage: 'Please log in' })
  }
  if (!roles.includes(me.role)) {
    throw createError({ statusCode: 403, statusMessage: 'You are not allowed to do this' })
  }
  return me
}