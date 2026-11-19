import type { PublicEmergencyContact } from '~~/shared/types/api'

export function useEmergencyContacts() {
  const {
    data,
    pending,
    error,
    refresh
  } = useFetch<PublicEmergencyContact[]>('/api/public/emergency-contacts', {
    default: () => []
  })

  // EMERGENCY CONTACT LIST
  const emergencyContacts = computed<PublicEmergencyContact[]>(
    () => data.value ?? []
  )

  // ERROR MESSAGE
  const errorMessage = computed<string | null>(() => {
    const e = error.value as {
      statusMessage?: string
      message?: string
    } | null | undefined

    return e
      ? (e.statusMessage ?? e.message ?? 'Could not load emergency contacts.')
      : null
  })

  return {
    emergencyContacts,
    pending,
    errorMessage,
    refresh
  }
}