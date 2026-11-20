import type { AlertLevel } from '~~/shared/types/api'

export function useAlertLevels() {
  const route = useRoute()
  const { data, error, pending, refresh } = useFetch<AlertLevel[]>('/api/staff/alert-levels')

  const levels = computed(() => data.value ?? [])
  const busy = ref(false)
  const statusCode = computed(() => {
    const requestError = error.value as {
      status?: number
      statusCode?: number
      data?: { statusCode?: number }
    } | null | undefined
    return requestError?.statusCode ?? requestError?.status ?? requestError?.data?.statusCode ?? null
  })
  const errorMessage = computed(() => {
    const requestError = error.value as {
      statusMessage?: string
      message?: string
      data?: { statusMessage?: string }
    } | null | undefined

    if (statusCode.value === 403) return "You don't have access to alert levels."
    return requestError
      ? requestError.data?.statusMessage
        ?? requestError.statusMessage
        ?? requestError.message
        ?? 'Could not load alert levels.'
      : null
  })

  watch(statusCode, (code) => {
    if (code === 401) {
      navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  })

  const updateLevel = async (id: number, levelFt: number): Promise<AlertLevel> => {
    busy.value = true
    try {
      const updated = await $fetch<AlertLevel>(`/api/admin/alert-levels/${id}`, {
        method: 'PATCH',
        body: { level_ft: levelFt }
      })
      await refresh()
      return updated
    } catch (requestError) {
      const typedError = requestError as {
        status?: number
        statusCode?: number
        data?: { statusCode?: number }
      }
      if (typedError.statusCode === 401
        || typedError.status === 401
        || typedError.data?.statusCode === 401) {
        await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      }
      throw requestError
    } finally {
      busy.value = false
    }
  }

  return {
    levels,
    pending,
    busy,
    errorMessage,
    refresh,
    updateLevel
  }
}
