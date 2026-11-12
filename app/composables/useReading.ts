// useReadings(): the points for the water-level chart, refreshed every minute.
//
//   Public page (always the last 24 hours):
//     const { points, chartPoints, hasPoints } = useReadings()
//
//   Staff/admin page, with a range picker (24h, 7d, 30d or 90d):
//     const range = ref<ReadingRange>('24h')
//     const { points } = useReadings({ staff: true, range })
//     // change range.value and the chart data reloads by itself
//
// Each point is the HIGHEST water level in its time slice (so peaks never hide), oldest first,
// at most 300 points. Use any chart library you like: the data is ready for it.
import type { ReadingPoint, ReadingRange, ReadingsResponse } from '~~/shared/types/api'

const POLL_MS = 60_000 // a chart does not need 10-second updates

export function useReadings(options: { staff?: boolean; range?: MaybeRefOrGetter<ReadingRange> } = {}) {
  const staff = options.staff === true
  const route = useRoute()

  // The public route ignores `range` and always returns 24 hours.
  const range = computed<ReadingRange>(() => (staff ? toValue(options.range) ?? '24h' : '24h'))

  const { data, error, pending, refresh } = useFetch<ReadingsResponse>(
    staff ? '/api/staff/readings' : '/api/public/readings',
    { query: computed(() => (staff ? { range: range.value } : {})) } // changing the range reloads the data
  )

  /** [{ t: "2026-11-09T02:00:00.000Z", water_level_cm: 4.2 }, ...] oldest first. Empty while loading. */
  const points = computed<ReadingPoint[]>(() => data.value?.points ?? [])

  /** The same points with a number for the time, which most chart libraries want: { x: milliseconds, y: cm }. */
  const chartPoints = computed(() => points.value.map(p => ({ x: new Date(p.t).getTime(), y: p.water_level_cm })))

  /** false when there is nothing to draw yet. Show "No readings in this period" instead of an empty chart. */
  const hasPoints = computed(() => points.value.length > 0)

  /** The highest level in the period, or null when there are no points. */
  const peak = computed<number | null>(() =>
    points.value.length ? Math.max(...points.value.map(p => p.water_level_cm)) : null
  )

  const errorMessage = computed<string | null>(() => {
    const e = error.value as { statusMessage?: string; message?: string } | null | undefined
    return e ? (e.statusMessage ?? e.message ?? 'Could not load the chart data.') : null
  })

  if (import.meta.client) {
    const timer = setInterval(() => {
      if (!document.hidden) refresh()
    }, POLL_MS)
    onBeforeUnmount(() => clearInterval(timer))
  }

  // Expired login on a staff page: go to the login page and come back after.
  if (staff) {
    watch(
      () => (error.value as { statusCode?: number } | null | undefined)?.statusCode,
      (code) => {
        if (code === 401) navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      }
    )
  }

  return { range, points, chartPoints, hasPoints, peak, errorMessage, pending, refresh }
}