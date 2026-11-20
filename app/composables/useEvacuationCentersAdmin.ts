import type {
  EvacuationCenter,
  EvacuationCenterInput
} from '~~/shared/types/api'

export type EvacuationCenterPatch = Partial<EvacuationCenterInput>

export function useEvacuationCentersAdmin() {
  const route = useRoute()
  const { data, error, pending, refresh } = useFetch<EvacuationCenter[]>(
    '/api/public/evacuation-centers'
  )

  const centers = computed(() => data.value ?? [])
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
      data?: { statusMessage?: string }
      statusMessage?: string
      message?: string
    } | null | undefined

    if (statusCode.value === 403) return "You don't have access to evacuation center management."
    return requestError
      ? requestError.data?.statusMessage
        ?? requestError.statusMessage
        ?? requestError.message
        ?? 'Could not load evacuation centers.'
      : null
  })

  watch(statusCode, (code) => {
    if (code === 401) {
      navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  })

  const runMutation = async <T>(request: () => Promise<T>): Promise<T> => {
    busy.value = true
    try {
      const result = await request()
      await refresh()
      return result
    } catch (requestError) {
      const typedError = requestError as { status?: number; statusCode?: number }
      if (typedError.statusCode === 401 || typedError.status === 401) {
        await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      }
      throw requestError
    } finally {
      busy.value = false
    }
  }

  const create = (input: EvacuationCenterInput): Promise<EvacuationCenter> =>
    runMutation(() => $fetch<EvacuationCenter>('/api/admin/evacuation-centers', {
      method: 'POST',
      body: input
    }))

  const update = (id: number, patch: EvacuationCenterPatch): Promise<EvacuationCenter> =>
    runMutation(() => $fetch<EvacuationCenter>(`/api/admin/evacuation-centers/${id}`, {
      method: 'PATCH',
      body: patch
    }))

  const remove = (id: number): Promise<{ ok: true }> =>
    runMutation(() => $fetch<{ ok: true }>(`/api/admin/evacuation-centers/${id}`, {
      method: 'DELETE'
    }))

  return {
    centers,
    pending,
    busy,
    errorMessage,
    statusCode,
    refresh,
    create,
    update,
    remove
  }
}
