export default defineEventHandler(async () => {
  const { data, error } = await serverSupabase()
    .from('alert_levels')
    .select('code, level_ft, level_cm')
    .order('level_ft')

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})