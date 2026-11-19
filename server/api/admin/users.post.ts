// POST /api/admin/users   body: UserCreateInput   returns: UserRecord (201)   (admin only)
// Creates the login (Supabase Auth) and the NioGabay profile. The admin tells the person the password.
import type { Role, UserRecord } from '../../../shared/types/api'

const ROLES: readonly Role[] = ['admin', 'staff']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event): Promise<UserRecord> => {
  await requireUser(event, ['admin'])
  const body = await readObjectBody(event)

  const email = requiredText(body.email, 'email', 3, 254).toLowerCase()
  if (!EMAIL.test(email)) return badRequest('email is not a valid email address')

  // Not trimmed, because spaces can be part of a password. 72 is the longest the login system uses.
  const password = body.password
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return badRequest('password must be 8 to 72 characters')
  }

  const fullName = requiredText(body.full_name, 'full_name', 1, 100)
  const positionTitle = optionalText(body.position_title, 'position_title', 100)
  const role = oneOfValues(body.role, 'role', ROLES)

  const db = serverSupabase()

  // 1. The login
  const { data: created, error: createError_ } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true // the admin is vouching for this address, so no confirmation email is needed
  })
  if (createError_ || !created?.user) {
    const code = (createError_ as { code?: string } | null)?.code
    if (code === 'email_exists' || code === 'user_already_exists') {
      throw createError({ statusCode: 409, statusMessage: 'An account with that email already exists' })
    }
    if (code === 'weak_password') return badRequest('That password is too weak. Use a longer, less common one.')
    return dbFail('create user', createError_)
  }
  const userId = created.user.id

  // 2. The profile. If this fails, remove the login again so nothing half-made is left behind.
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .insert({ id: userId, full_name: fullName, position_title: positionTitle, role, is_active: true })
    .select('id, full_name, position_title, role, is_active, created_at')
    .single()
  if (profileError || !profile) {
    const { error: undoError } = await db.auth.admin.deleteUser(userId)
    if (undoError) console.error('create user: could not remove the login after a failed profile', undoError)
    return dbFail('create user profile', profileError)
  }

  setResponseStatus(event, 201)
  return {
    id: profile.id,
    email,
    full_name: profile.full_name,
    position_title: profile.position_title ?? null,
    role: profile.role as Role,
    is_active: profile.is_active === true,
    created_at: new Date(profile.created_at).toISOString()
  }
})
