// GET /api/admin/users   returns: UserRecord[]   (admin only)
// Everyone who can log in, including deactivated accounts, oldest first.
import type { Role, UserRecord } from '../../../shared/types/api'

export default defineEventHandler(async (event): Promise<UserRecord[]> => {
  await requireUser(event, ['admin'])
  const db = serverSupabase()

  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, full_name, position_title, role, is_active, created_at')
    .order('created_at', { ascending: true })
  if (error) return dbFail('admin users', error)

  // The email lives in Supabase Auth, not in our profiles table.
  const { data: authData, error: authError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authError) return dbFail('admin users: auth list', authError)
  const emailById = new Map<string, string>(
    (authData?.users ?? []).map((u: { id: string; email?: string | null }) => [u.id, u.email ?? ''])
  )

  return (profiles ?? []).map((p: any) => ({
    id: p.id,
    email: emailById.get(p.id) ?? '',
    full_name: p.full_name,
    position_title: p.position_title ?? null,
    role: p.role as Role,
    is_active: p.is_active === true,
    created_at: new Date(p.created_at).toISOString()
  }))
})
