// POST /api/auth/login   body: { email, password }   returns: Me
//
// Supabase Auth checks the password. We then look up the person's NioGabay profile
// (role, active or not) and remember who they are in a sealed login cookie.
import type { Me, Role } from '../../../shared/types/api'
import { findMockAccount } from '../../utils/mockAuth'
 
const SESSION_HOURS = 8
 
export default defineEventHandler(async (event): Promise<Me> => {
  const body = await readBody(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
 
  if (!email || email.length > 254 || !password || password.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const config = useRuntimeConfig()
  if (config.mockAuthEnabled) {
    const account = findMockAccount(email, password)
    if (!account) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
    }

    await setUserSession(
      event,
      { user: { id: account.user.id, email: account.user.email } },
      { maxAge: 60 * 60 * SESSION_HOURS }
    )

    return account.user
  }
 
  // --- 1. Check the password with Supabase Auth ------------------------
  const { data, error } = await serverSupabaseAnon().auth.signInWithPassword({ email, password })
 
  if (error || !data.user) {
    // 400/401/422 = wrong password, unknown email, or unconfirmed email. One message for all,
    // so nobody can use this form to find out which emails have accounts.
    if (error && [400, 401, 422].includes(error.status ?? 0)) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
    }
    console.error('login: Supabase Auth problem', error?.status, error?.code, error?.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Login is temporarily unavailable. Please try again in a minute.'
    })
  }
 
  // --- 2. Find their NioGabay profile ---------------------------------
  const { data: profile, error: profileError } = await serverSupabase()
    .from('profiles')
    .select('id, full_name, position_title, role, is_active')
    .eq('id', data.user.id)
    .maybeSingle()
 
  if (profileError) {
    console.error('login: profile lookup failed', profileError)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
  if (!profile) {
    throw createError({
      statusCode: 403,
      statusMessage: 'This account has no NioGabay profile yet. Ask an administrator.'
    })
  }
  if (!profile.is_active) {
    throw createError({ statusCode: 403, statusMessage: 'This account has been deactivated.' })
  }
 
  // --- 3. Remember who they are (id and email only; the role is re-read on each request)
  const userEmail = data.user.email ?? email
  await setUserSession(
    event,
    { user: { id: profile.id, email: userEmail } },
    { maxAge: 60 * 60 * SESSION_HOURS }
  )
 
  return {
    id: profile.id,
    email: userEmail,
    full_name: profile.full_name,
    position_title: profile.position_title,
    role: profile.role as Role
  }
})