// PATCH /api/admin/users/:id   body: UserPatch   returns: UserRecord   (admin only)
// Change the name, position, role, or switch the account off (is_active: false) and on again.
// A deactivated person is locked out at once, even if they are still logged in.
// Accounts are never deleted, so the history (who acknowledged an alert...) stays correct.
import type { Role, UserRecord } from '../../../../../shared/types/api'

const ROLES: readonly Role[] = ['admin', 'staff']

export default defineEventHandler(async (event): Promise<UserRecord> => {
  const me = await requireUser(event, ['admin'])
  const id = routeUuid(event)
  const body = await readObjectBody(event)

  const changes = pickFields(body, {
    full_name: v => requiredText(v, 'full_name', 1, 100),
    position_title: v => optionalText(v, 'position_title', 100),
    role: v => oneOfValues(v, 'role', ROLES),
    is_active: v => requiredBoolean(v, 'is_active')
  }, true)

  // Nobody can lock themselves out. Another admin can still change this account.
  if (id === me.id && (changes.role === 'staff' || changes.is_active === false)) {
    return badRequest('You cannot remove your own admin access or deactivate your own account')
  }

  const db = serverSupabase()
  const { data: profile, error } = await db
    .from('profiles')
    .update(changes)
    .eq('id', id)
    .select('id, full_name, position_title, role, is_active, created_at')
    .maybeSingle()
  if (error) return dbFail('update user', error)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const { data: authUser, error: authError } = await db.auth.admin.getUserById(id)
  if (authError) return dbFail('update user: auth lookup', authError)

  return {
    id: profile.id,
    email: authUser?.user?.email ?? '',
    full_name: profile.full_name,
    position_title: profile.position_title ?? null,
    role: profile.role as Role,
    is_active: profile.is_active === true,
    created_at: new Date(profile.created_at).toISOString()
  }
})
