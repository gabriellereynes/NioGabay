import {
  makeMockReadings,
  mockAlerts,
  mockAnnouncements,
  mockEvacuationCenters,
  mockFloodReports,
  mockMe,
  mockMeDisasterAdmin,
  mockMeStaff,
  mockStaffStatus,
  mockEmergencyContacts
} from '~~/mocks'
import type {
  AlertRecord,
  Announcement,
  FloodReport,
  FloodReportInput,
  FloodReportPatch,
  Me,
  ReadingRange,
  ReadingsResponse,
  StaffStatus
} from '~~/shared/types/api'
import { toRaw } from 'vue'

const USE_MOCK_DATA = true
const MOCK_ME = mockMeStaff
// Switch MOCK_ME to mockMe for admin or mockMeStaff for staff testing.

const clone = <T>(value: T): T => structuredClone(toRaw(value))
const plainItems = <T extends object>(items: T[]) => items.map(item => ({ ...toRaw(item) }))

const realRequest = async <T>(url: string, options?: RequestInit) =>
  $fetch<T>(url, options)

export const useBackend = () => {
  const reportState = useState('mock-flood-reports', () => clone(mockFloodReports))
  const announcementState = useState('mock-announcements', () => clone(mockAnnouncements))
  const alertState = useState('mock-alerts', () => clone(mockAlerts))

  const getMe = async (): Promise<Me> => {
    if (USE_MOCK_DATA) {
      const auth = useAuth()
      if (auth.me.value === undefined) await auth.refresh()
      if (auth.me.value) return clone(auth.me.value)
      return clone(MOCK_ME)
    }
    return realRequest<Me>('/api/auth/me')
  }

  const getStatus = async (): Promise<StaffStatus> => {
    if (USE_MOCK_DATA) return clone(mockStaffStatus)
    return realRequest<StaffStatus>('/api/staff/status')
  }

  const getReadings = async (range: ReadingRange): Promise<ReadingsResponse> => {
    if (USE_MOCK_DATA) {
      const hours = range === '24h' ? 24 : range === '7d' ? 168 : range === '30d' ? 720 : 2160
      return clone(makeMockReadings(Math.min(hours, 720)))
    }
    return realRequest<ReadingsResponse>(`/api/staff/readings?range=${range}`)
  }

  const getAlerts = async () => {
    if (USE_MOCK_DATA) {
      return {
        total: alertState.value.total,
        items: plainItems(alertState.value.items)
      }
    }
    return realRequest<{ items: AlertRecord[]; total: number }>('/api/staff/alerts?limit=20&offset=0')
  }

  const acknowledgeAlert = async (id: number) => {
    if (USE_MOCK_DATA) {
      const alert = alertState.value.items.find(item => item.id === id)
      if (alert) {
        alert.acknowledged_by_name = mockMe.full_name
        alert.acknowledged_at = new Date().toISOString()
      }
      return alert
    }
    return realRequest<AlertRecord>(`/api/staff/alerts/${id}/acknowledge`, { method: 'POST' })
  }

  const getFloodReports = async () => {
    if (USE_MOCK_DATA) {
      return {
        total: reportState.value.total,
        items: plainItems(reportState.value.items)
      }
    }
    return realRequest<{ items: FloodReport[]; total: number }>('/api/staff/flood-reports?limit=20&offset=0')
  }

  const createFloodReport = async (input: FloodReportInput) => {
    if (USE_MOCK_DATA) {
      const report: FloodReport = {
        id: Date.now(),
        reported_at: input.reported_at ?? new Date().toISOString(),
        flooded_areas: input.flooded_areas ?? null,
        passable_roads: input.passable_roads ?? null,
        impassable_roads: input.impassable_roads ?? null,
        families_evacuated: input.families_evacuated,
        individuals_evacuated: input.individuals_evacuated,
        remarks: input.remarks ?? null,
        created_by_name: mockMe.full_name
      }
      reportState.value.items.unshift(report)
      reportState.value.total++
      return report
    }
    return realRequest<FloodReport>('/api/staff/flood-reports', {
      method: 'POST',
      body: input as BodyInit
    })
  }

  const updateFloodReport = async (id: number, patch: FloodReportPatch) => {
    if (USE_MOCK_DATA) {
      const report = reportState.value.items.find(item => item.id === id)
      if (!report) throw createError({ statusCode: 404, statusMessage: 'Flood report not found.' })

      Object.assign(report, {
        ...patch,
        flooded_areas: patch.flooded_areas ?? null,
        passable_roads: patch.passable_roads ?? null,
        impassable_roads: patch.impassable_roads ?? null,
        remarks: patch.remarks ?? null
      })
      return { ...toRaw(report) }
    }
    return realRequest<FloodReport>(`/api/staff/flood-reports/${id}`, {
      method: 'PATCH',
      body: patch as BodyInit
    })
  }

  const getAnnouncements = async () => {
    if (USE_MOCK_DATA) {
      return clone({
        ...announcementState.value,
        items: announcementState.value.items
          .filter(item => item.published_at === null)
          .map(item => ({ ...toRaw(item) }))
      })
    }
    return realRequest<{ items: Announcement[]; total: number }>('/api/staff/announcements?limit=20&offset=0')
  }

  const createDraft = async (input: Pick<Announcement, 'title' | 'body' | 'category'>) => {
    if (USE_MOCK_DATA) {
      const now = new Date().toISOString()
      const draft: Announcement = {
        id: Date.now(),
        ...input,
        published_at: null,
        created_by_name: mockMe.full_name,
        created_at: now,
        updated_at: now
      }
      announcementState.value.items.unshift(draft)
      announcementState.value.total++
      return draft
    }
    return realRequest<Announcement>('/api/staff/announcements', {
      method: 'POST',
      body: { ...input, publish: false } as BodyInit
    })
  }

  return {
    getMe,
    getStatus,
    getReadings,
    getAlerts,
    acknowledgeAlert,
    getFloodReports,
    createFloodReport,
    updateFloodReport,
    getAnnouncements,
    createDraft,
    evacuationCenters: clone(mockEvacuationCenters),
    emergencyContacts: clone(mockEmergencyContacts)
  }
}
