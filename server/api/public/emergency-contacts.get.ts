// GET /api/public/emergency-contacts   returns: PublicEmergencyContact[]   (no login needed)
// Active contacts only, in the order the admin set (sort_order).
import type { PublicEmergencyContact } from '../../../shared/types/api'

export default defineEventHandler(async (): Promise<PublicEmergencyContact[]> => {
  const { data, error } = await serverSupabase()
    .from('emergency_contacts')
    .select('id, name, category, number')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    console.error('public emergency contacts failed', error)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    category: c.category ?? null,
    number: c.number
  }))
})
