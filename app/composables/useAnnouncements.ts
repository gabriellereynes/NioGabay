
import { computed } from 'vue'
import type { PublicAnnouncement } from '~~/shared/types/api'

// Fetch the latest 3 published announcements for the public homepage.
export function useAnnouncements() {
  const { data, error, pending } = useFetch<PublicAnnouncement[]>(
    '/api/public/announcements?limit=3'
  )

  /** The list of announcements, or an empty array when no data is available. */
  const announcements = computed<PublicAnnouncement[]>(
    () => data.value ?? []
  )

  /** A message you can show the user, or null when everything is fine. */
  const errorMessage = computed<string | null>(() => {
    const e = error.value as {
      statusMessage?: string
      message?: string
    } | null | undefined

    return e
      ? (e.statusMessage ?? e.message ?? 'Could not load announcements.')
      : null
  })

  return { announcements, pending, errorMessage }
}
