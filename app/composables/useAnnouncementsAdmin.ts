import type {
  Announcement,
  AnnouncementInput,
  AnnouncementPatch,
  Paged
} from '~~/shared/types/api'

function formatManila(timestamp: string | null | undefined) {
  if (!timestamp) return null

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Manila'
  }).format(new Date(timestamp))
}

export function useAnnouncementsAdmin() {
  const route = useRoute()
  const limit = ref(20)
  const offset = ref(0)
  const query = computed(() => ({ limit: limit.value, offset: offset.value }))
  const { data, error, pending, refresh } = useFetch<Paged<Announcement>>(
    '/api/staff/announcements',
    { query }
  )

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const totalPages = computed(() => Math.ceil(total.value / limit.value))
  const page = computed(() => total.value ? Math.floor(offset.value / limit.value) + 1 : 0)
  const busy = ref(false)

  const errorMessage = computed(() => {
    const requestError = error.value as {
      data?: { statusMessage?: string }
      statusMessage?: string
      message?: string
    } | null | undefined

    return requestError
      ? requestError.data?.statusMessage
        ?? requestError.statusMessage
        ?? requestError.message
        ?? 'Could not load announcements.'
      : null
  })

  const statusCode = computed(
    () => (error.value as { statusCode?: number } | null | undefined)?.statusCode ?? null
  )

  const previousPage = () => {
    offset.value = Math.max(0, offset.value - limit.value)
  }

  const nextPage = () => {
    if (offset.value + limit.value < total.value) {
      offset.value += limit.value
    }
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

  watch(statusCode, (code) => {
    if (code === 401) {
      navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  })

  const handleMutationError = async (requestError: unknown): Promise<never> => {
    const typedError = requestError as {
      status?: number
      statusCode?: number
      data?: { statusMessage?: string }
      statusMessage?: string
      message?: string
    }
    const code = typedError.statusCode ?? typedError.status

    if (code === 401) {
      await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }

    throw requestError
  }

  const create = async (input: AnnouncementInput): Promise<Announcement> => {
    busy.value = true
    try {
      const record = await $fetch<Announcement>('/api/staff/announcements', {
        method: 'POST',
        body: input
      })
      await refresh()
      return record
    } catch (requestError) {
      return handleMutationError(requestError)
    } finally {
      busy.value = false
    }
  }

  const update = async (id: number, patch: AnnouncementPatch): Promise<Announcement> => {
    busy.value = true
    try {
      const record = await $fetch<Announcement>(`/api/staff/announcements/${id}`, {
        method: 'PATCH',
        body: patch
      })
      await refresh()
      return record
    } catch (requestError) {
      return handleMutationError(requestError)
    } finally {
      busy.value = false
    }
  }

  const remove = async (id: number): Promise<void> => {
    busy.value = true
    try {
      await $fetch<{ ok: true }>(`/api/staff/announcements/${id}`, {
        method: 'DELETE'
      })
      await refresh()
    } catch (requestError) {
      await handleMutationError(requestError)
    } finally {
      busy.value = false
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
    busy,
    errorMessage,
    statusCode,
    refresh,
    previousPage,
    nextPage,
    create,
    update,
    remove,
    formatManila
  }
}
