
import type { EvacuationCenter } from '~~/shared/types/api'

export function useEvacuationCenters() {
  const {
    data,
    pending,
    error,
    refresh
  } = useFetch<EvacuationCenter[]>('/api/public/evacuation-centers', {
    default: () => []
  })

  // EVACUATION CENTER LIST
  const evacuationCenters = computed<EvacuationCenter[]>(
    () => data.value ?? []
  )

  // ERROR MESSAGE
  const errorMessage = computed<string | null>(() => {
    const e = error.value as {
      statusMessage?: string
      message?: string
    } | null | undefined

    return e
      ? (e.statusMessage ?? e.message ?? 'Could not load evacuation centers.')
      : null
  })

  return {
    evacuationCenters,
    pending,
    errorMessage,
    refresh
  }
}
