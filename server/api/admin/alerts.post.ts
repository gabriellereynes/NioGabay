// POST /api/admin/alerts   body: ManualAlertInput   returns: AlertRecord (201)   (admin only)
// Sends a manual alert. It appears in the alert list like the automatic ones.
//
// NOTE: the SMS service is not connected yet (planned next). Until then `send_sms: true` is
// accepted, but NOTHING is texted. The dashboard must say so, so nobody thinks residents were warned.
import type { AlertRecord, ManualAlertInput } from '../../../shared/types/api'

const LEVEL_CODES = ['yellow', 'orange', 'red']

export default defineEventHandler(async (event): Promise<AlertRecord> => {
  const me = await requireUser(event, ['admin'])

  const body = (await readBody(event)) as Partial<Record<keyof ManualAlertInput, unknown>> | null
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (message.length < 1 || message.length > 320) {
    throw createError({ statusCode: 400, statusMessage: 'message must be 1 to 320 characters' })
  }

  const level = body?.alert_level ?? null
  if (level !== null && (typeof level !== 'string' || !LEVEL_CODES.includes(level))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'alert_level must be yellow, orange, red or null'
    })
  }

  const sendSms = body?.send_sms ?? false
  if (typeof sendSms !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'send_sms must be true or false' })
  }

  const db = serverSupabase()

  let levelId: number | null = null
  if (level !== null) {
    const { data, error } = await db.from('alert_levels').select('id').eq('code', level).maybeSingle()
    if (error) {
      console.error('manual alert: level lookup failed', error)
      throw createError({ statusCode: 500, statusMessage: 'Database error' })
    }
    if (!data) {
      throw createError({ statusCode: 400, statusMessage: `Unknown alert level: ${level}` })
    }
    levelId = data.id
  }

  const { data: row, error: insertError } = await db
    .from('alerts')
    .insert({ source: 'manual', alert_level_id: levelId, message, created_by: me.id })
    .select(ALERT_COLUMNS)
    .single()
  if (insertError || !row) {
    console.error('manual alert: insert failed', insertError)
    throw createError({ statusCode: 500, statusMessage: 'Could not save the alert' })
  }

  if (sendSms) {
    // TODO (SMS step): send the text to every active subscriber here.
    console.warn(`manual alert ${row.id}: send_sms was requested but the SMS service is not connected yet`)
  }

  const record = (await hydrateAlerts([row as AlertRow]))[0]
  if (!record) {
    throw createError({ statusCode: 500, statusMessage: 'Could not load the alert' })
  }
  setResponseStatus(event, 201)
  return record
})
