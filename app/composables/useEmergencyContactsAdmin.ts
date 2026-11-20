import type {
  EmergencyContact,
  EmergencyContactInput
} from '~~/shared/types/api'

export type EmergencyContactPatch = Partial<EmergencyContactInput>

export function useEmergencyContactsAdmin() {
  const route = useRoute()
  const { data, error, pending, refresh } = useFetch<EmergencyContact[]>(
    '/api/admin/emergency-contacts'
  )

  const contacts = computed(() => data.value ?? [])
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

    if (statusCode.value === 403) return "You don't have access to emergency contact management."
    return requestError
      ? requestError.data?.statusMessage
        ?? requestError.statusMessage
        ?? requestError.message
        ?? 'Could not load emergency contacts.'
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

  const create = (input: EmergencyContactInput): Promise<EmergencyContact> =>
    runMutation(() => $fetch<EmergencyContact>('/api/admin/emergency-contacts', {
      method: 'POST',
      body: input
    }))

  const update = (id: number, patch: EmergencyContactPatch): Promise<EmergencyContact> =>
    runMutation(() => $fetch<EmergencyContact>(`/api/admin/emergency-contacts/${id}`, {
      method: 'PATCH',
      body: patch
    }))

  const remove = (id: number): Promise<{ ok: true }> =>
    runMutation(() => $fetch<{ ok: true }>(`/api/admin/emergency-contacts/${id}`, {
      method: 'DELETE'
    }))

  return {
    contacts,
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
