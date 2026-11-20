// Staff and admin: flood field reports (list with paging, create, edit). Reports are never deleted.
//
//   const { items, total, page, totalPages, pending, busy, errorMessage, statusCode,
//           previousPage, nextPage, create, update } = useFloodReports()
//
// Routes (docs/api-contract.md): GET /api/staff/flood-reports?limit=&offset=,
// POST /api/staff/flood-reports, PATCH /api/staff/flood-reports/:id
// Same pattern as useAnnouncementsAdmin: create() and update() THROW the server's error, so the page
// catches it and shows error.data.statusMessage.
import type { FloodReport, FloodReportInput, FloodReportPatch, Paged } from '~~/shared/types/api'

export const useFloodReports = () => {
  const limit = ref(20)
  const offset = ref(0)

  // limit and offset are refs, so changing them loads the new page by itself.
  const { data, error, pending, refresh } = useFetch<Paged<FloodReport>>('/api/staff/flood-reports', {
    key: 'staff-flood-reports',
    query: { limit, offset },
    default: () => ({ items: [], total: 0 })
  })

  const items = computed<FloodReport[]>(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const page = computed(() => Math.floor(offset.value / limit.value) + 1)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

  const statusCode = computed<number | null>(() => {
    const e = error.value as { statusCode?: number; status?: number } | null
    return e ? (e.statusCode ?? e.status ?? null) : null
  })

  const errorMessage = computed<string | null>(() => {
    const e = error.value as { statusMessage?: string; message?: string } | null
    return e ? (e.statusMessage ?? e.message ?? 'Could not load the flood reports.') : null
  })

  const previousPage = () => { offset.value = Math.max(0, offset.value - limit.value) }
  const nextPage = () => { if (offset.value + limit.value < total.value) offset.value += limit.value }

  /** True while a create or update request is running (use it to disable the buttons). */
  const busy = ref(false)

  const create = async (input: FloodReportInput): Promise<FloodReport> => {
    busy.value = true
    try {
      const created = await $fetch<FloodReport>('/api/staff/flood-reports', { method: 'POST', body: input })
      offset.value = 0 // the newest report is first, so go back to page 1
      await refresh()
      return created
    } finally {
      busy.value = false
    }
  }

  /** Send only the fields that changed. Use null to clear a text field. */
  const update = async (id: number, patch: FloodReportPatch): Promise<FloodReport> => {
    busy.value = true
    try {
      const updated = await $fetch<FloodReport>(`/api/staff/flood-reports/${id}`, { method: 'PATCH', body: patch })
      await refresh()
      return updated
    } finally {
      busy.value = false
    }
  }

  return {
    items, total, limit, offset, page, totalPages,
    pending, busy, errorMessage, statusCode,
    previousPage, nextPage, create, update
  }
}
