// useFloodStatus(): the current flood status, refreshed every 10 seconds.
//
//   Public page:      const { status, isOffline, lastUpdated } = useFloodStatus()
//   Staff/admin page: const { status } = useFloodStatus({ staff: true })   // status has the extra staff fields
//
// Nuxt finds this automatically (it is in app/composables), so there is no import line to write.
// Pages never call the API themselves: they call this, and only this file knows the URL.
//NEED PARA DI MAGRED SI COMPUTED
import { computed } from 'vue'
import type { FloodStatus, StaffStatus } from '~~/shared/types/api'
 
const POLL_MS = 10_000 // the contract says: poll status every 10 seconds, never faster
// NEED PARA DI MAGRED UNG MANILA TIME KINEME 
function formatManila(timestamp: string | null | undefined) {
  if (!timestamp) return null

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Manila'
  }).format(new Date(timestamp))
}

function useStatusFetch<T extends FloodStatus>(url: string, staff: boolean) {
  const route = useRoute()
  const { data, error, pending, refresh } = useFetch<T>(url)
 
  /** The status, or null while it is still loading or when the request failed. */
  const status = computed<T | null>(() => (data.value as T | null)?? null) // nag add ng T | null kase para itreat ung fetched data as either expected typr or null
 
  /** A message you can show the user, or null when everything is fine. */
  const errorMessage = computed<string | null>(() => {
    const e = error.value as { statusMessage?: string; message?: string } | null | undefined
    return e ? (e.statusMessage ?? e.message ?? 'Could not load the status.') : null
  })
  const statusCode = computed<number | null>(
    () => (error.value as { statusCode?: number } | null | undefined)?.statusCode ?? null
  )
 
  /** true when no reading arrived in the last 5 minutes. The numbers may then be OUT OF DATE: warn the user. */
  const isOffline = computed(() => status.value !== null && !status.value.sensor_online)
 
  /** false when the sensor has never sent anything. Show "No data yet" instead of a number. */
  const hasData = computed(() => status.value !== null && status.value.last_reading_at !== null)
 
  /** "November 10, 2026 at 9:23 AM" in Philippine time, or "No data yet". */
  const lastUpdated = computed(() => formatManila(status.value?.last_reading_at) || 'No data yet')
 
  // Poll while the page is open, but not while the browser tab is hidden.
  if (import.meta.client) {
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, POLL_MS)
    onBeforeUnmount(() => clearInterval(timer))
  }
 
  // Staff routes need a login. If it has expired (401), go to the login page and come back after.
  if (staff) {
    watch(statusCode, (code) => {
      if (code === 401) navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    })
  }
 
  return { status, errorMessage, pending, refresh, isOffline, hasData, lastUpdated }
}
 
export function useFloodStatus(): ReturnType<typeof useStatusFetch<FloodStatus>>
export function useFloodStatus(options: { staff: true }): ReturnType<typeof useStatusFetch<StaffStatus>>
export function useFloodStatus(options: { staff?: boolean } = {}) {
  return options.staff
    ? useStatusFetch<StaffStatus>('/api/staff/status', true)
    : useStatusFetch<FloodStatus>('/api/public/status', false)
}