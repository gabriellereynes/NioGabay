// PATCH /api/admin/alert-levels/:id   body: { level_ft }   returns: AlertLevel   (admin only)
// Changes one threshold. The order must stay yellow < orange < red, or it is refused (400).
// Only NEW readings use the new value. Past alerts are not changed.
import type { AlertLevel } from '../../../../../shared/types/api'

const ORDER = ['yellow', 'orange', 'red']

export default defineEventHandler(async (event): Promise<AlertLevel> => {
  await requireUser(event, ['admin'])
  const id = routeInt(event)
  const body = await readObjectBody(event)

  const ft = body.level_ft
  if (typeof ft !== 'number' || !Number.isFinite(ft) || ft <= 0 || ft > 30) {
    return badRequest('level_ft must be a number above 0 and at most 30')
  }
  const levelFt = Math.round(ft * 100) / 100 // the database keeps 2 decimals

  const levels = await loadAlertLevels()
  const target = levels.find(l => l.id === id)
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Alert level not found' })

  // Check the order with the new value in place.
  const afterChange = ORDER
    .map(code => levels.find(l => l.code === code))
    .filter((l): l is AlertLevel => l !== undefined)
    .map(l => (l.id === id ? levelFt : l.level_ft))
  for (let i = 1; i < afterChange.length; i++) {
    if ((afterChange[i] ?? 0) <= (afterChange[i - 1] ?? 0)) {
      return badRequest('Levels must stay in order: yellow < orange < red')
    }
  }

  const { error } = await serverSupabase().from('alert_levels').update({ level_ft: levelFt }).eq('id', id)
  if (error) return dbFail('update alert level', error)

  const updated = (await loadAlertLevels()).find(l => l.id === id)
  if (!updated) return dbFail('update alert level', 'level missing after update')
  return updated
})