
import { computed } from 'vue'
import type { PublicAnnouncement } from '~~/shared/types/api'

// Fetch published announcements with an optional result limit.
export function useAnnouncements(limit?: number) {
  const { data, error, pending } = useFetch<PublicAnnouncement[]>(
    '/api/public/announcements',
    {
      query: limit ? { limit } : {}
    }
  )

  // Announcements list
  const announcements = computed<PublicAnnouncement[]>(
    () => data.value ?? []
  )

  // Error message
  const errorMessage = computed<string | null>(() => {
    const e = error.value as {
      statusMessage?: string
      message?: string
    } | null | undefined

    return e
      ? (e.statusMessage ?? e.message ?? 'Could not load announcements.')
      : null
  })

  return {
    announcements,
    pending,
    errorMessage
  }
}
