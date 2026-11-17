import type { AlertRecord, Paged } from '~~/shared/types/api'

const POLL_MS = 10_000

export function useAlerts() {
  const route = useRoute()
  const limit = ref(20)
  const offset = ref(0)
  const query = computed(() => ({ limit: limit.value, offset: offset.value }))
  const { data, error, pending, refresh } = useFetch<Paged<AlertRecord>>(
    '/api/staff/alerts',
    { query }
  )

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const page = computed(() => total.value ? Math.floor(offset.value / limit.value) + 1 : 0)
  const errorMessage = computed(() => {
    const requestError = error.value as { statusMessage?: string; message?: string } | null | undefined
    return requestError
      ? requestError.statusMessage ?? requestError.message ?? 'Could not load alerts.'
      : null
  })
  const statusCode = computed(
    () => (error.value as { statusCode?: number } | null | undefined)?.statusCode ?? null
  )

  const previousPage = () => {
    offset.value = Math.max(0, offset.value - limit.value)
  }

  const nextPage = () => {
    if (offset.value + limit.value < total.value) offset.value += limit.value
  }

  watch(limit, () => {
    offset.value = 0
  })

  watch(total, (value) => {
    if (value === 0) {
      offset.value = 0
    } else if (offset.value >= value) {
      offset.value = Math.floor((value - 1) / limit.value) * limit.value
    }
  })

  if (import.meta.client) {
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, POLL_MS)
    onBeforeUnmount(() => clearInterval(timer))
  }

  watch(statusCode, (code) => {
    if (code === 401) navigateTo({ path: '/login', query: { redirect: route.fullPath } })
  })

  const acknowledge = async (id: number): Promise<AlertRecord> => {
    try {
      const record = await $fetch<AlertRecord>(`/api/staff/alerts/${id}/acknowledge`, {
        method: 'POST'
      })
      await refresh()
      return record
    } catch (requestError) {
      const errorStatus = requestError as { status?: number; statusCode?: number }
      if (errorStatus.statusCode === 401 || errorStatus.status === 401) {
        await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      }
      throw requestError
    }
  }

  return {
    items,
    total,
    limit,
    offset,
    page,
    totalPages,
    pending,
    errorMessage,
    refresh,
    previousPage,
    nextPage,
    acknowledge
  }
}
