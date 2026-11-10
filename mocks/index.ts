// =====================================================================
// SAMPLE DATA ONLY. Not real people, places, or phone numbers.
// Lets you build and style screens before the real API routes exist.
// Every value matches the types in shared/types/api.ts (checked with tsc).
//
// Usage (put the switch in ONE composable so you change one line later):
//   import { mockFloodStatus } from '~~/mocks'
//   export const useFloodStatus = () => ref(mockFloodStatus)
//   // later:  useFetch<FloodStatus>('/api/public/status')
//
// Delete this folder when every screen uses the real API.
// =====================================================================
import type {
  AlertLevel,
  AlertRecord,
  Announcement,
  EmergencyContact,
  EvacuationCenter,
  FloodReport,
  FloodStatus,
  Me,
  Paged,
  PublicAnnouncement,
  PublicEmergencyContact,
  ReadingPoint,
  ReadingsResponse,
  StaffStatus,
  Subscriber,
  UserRecord
} from '../shared/types/api'

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
const hoursAgo = (h: number) => minutesAgo(h * 60)

// ---------- Alert levels (assumed: orange 3 ft, red 4 ft) ----------
export const mockAlertLevels: AlertLevel[] = [
  { id: 1, code: 'yellow', label: 'Yellow - Warning', level_ft: 1, level_cm: 30.5, description: 'Water reached 1 ft.' },
  { id: 2, code: 'evacuation', label: 'Evacuation', level_ft: 2, level_cm: 61, description: 'Start rescue and evacuation.' },
  { id: 3, code: 'orange', label: 'Orange - Alert', level_ft: 3, level_cm: 91.4, description: 'Assumed value.' },
  { id: 4, code: 'red', label: 'Red - Critical', level_ft: 4, level_cm: 121.9, description: 'Assumed value.' }
]

// ---------- Status ----------
/** Water at 2 ft: the "Evacuation" state. Edit alert_level / water_level_* by hand to see other states. */
export const mockFloodStatus: FloodStatus = {
  sensor_online: true,
  last_reading_at: minutesAgo(1),
  water_level_cm: 62,
  water_level_ft: 2,
  alert_level: 'evacuation',
  alert_label: 'Evacuation',
  levels: mockAlertLevels
}

/** Normal day, for comparison. */
export const mockFloodStatusNormal: FloodStatus = {
  ...mockFloodStatus,
  water_level_cm: 8,
  water_level_ft: 0.3,
  alert_level: 'normal',
  alert_label: 'Normal'
}

/** Sensor offline: the screen must warn that the level is out of date. */
export const mockFloodStatusOffline: FloodStatus = {
  ...mockFloodStatus,
  sensor_online: false,
  last_reading_at: hoursAgo(3)
}

export const mockStaffStatus: StaffStatus = {
  ...mockFloodStatus,
  sensor: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'NioGabay Sensor 1',
    location_description: 'Sample location, Barangay Niog',
    mount_height_cm: 250,
    is_active: true
  },
  latest_reading: { id: 1042, distance_cm: 188, water_level_cm: 62, recorded_at: minutesAgo(1) },
  unacknowledged_alerts: 2
}

// ---------- Readings for charts ----------
/** A flood that rises and falls. One point per 10 minutes, oldest first. */
export const makeMockReadings = (hours = 24): ReadingsResponse => {
  const count = hours * 6
  const points: ReadingPoint[] = []
  for (let i = 0; i < count; i++) {
    const x = i / count
    const level = 75 * Math.exp(-((x - 0.7) ** 2) / 0.02)
    points.push({
      t: minutesAgo((count - i) * 10),
      water_level_cm: Math.round(level * 10) / 10
    })
  }
  return { range: hours <= 24 ? '24h' : hours <= 168 ? '7d' : '30d', points }
}
export const mockReadings24h: ReadingsResponse = makeMockReadings(24)

// ---------- Alerts ----------
export const mockAlerts: Paged<AlertRecord> = {
  total: 3,
  items: [
    {
      id: 3, source: 'sensor', alert_level: 'evacuation', alert_label: 'Evacuation',
      message: 'Evacuation: water level is 62 cm (2 ft).', water_level_cm: 62,
      triggered_at: minutesAgo(20), created_by_name: null, acknowledged_by_name: null, acknowledged_at: null
    },
    {
      id: 2, source: 'manual', alert_level: 'yellow', alert_label: 'Yellow - Warning',
      message: 'Sample notice: please prepare go-bags and move valuables upstairs.', water_level_cm: null,
      triggered_at: minutesAgo(45), created_by_name: 'Sample Admin', acknowledged_by_name: null, acknowledged_at: null
    },
    {
      id: 1, source: 'sensor', alert_level: 'yellow', alert_label: 'Yellow - Warning',
      message: 'Yellow - Warning: water level is 32 cm (1 ft).', water_level_cm: 32,
      triggered_at: minutesAgo(70), created_by_name: null, acknowledged_by_name: 'Sample Staff', acknowledged_at: minutesAgo(65)
    }
  ]
}

// ---------- Announcements ----------
export const mockPublicAnnouncements: PublicAnnouncement[] = [
  { id: 2, title: 'Sample: Evacuation center now open', body: 'The sample evacuation center is open for families from low-lying areas.', category: 'evacuation', published_at: minutesAgo(30) },
  { id: 1, title: 'Sample: Flood advisory', body: 'Water level is rising. Stay alert and follow barangay instructions.', category: 'flood', published_at: hoursAgo(2) }
]

export const mockAnnouncements: Paged<Announcement> = {
  total: 3,
  items: [
    { id: 3, title: 'Sample draft: Relief goods schedule', body: 'Not published yet.', category: 'general', published_at: null, created_by_name: 'Sample Staff', created_at: hoursAgo(1), updated_at: hoursAgo(1) },
    ...mockPublicAnnouncements.map((a): Announcement => ({
      ...a, created_by_name: 'Sample Admin', created_at: a.published_at, updated_at: a.published_at
    }))
  ]
}

// ---------- Evacuation centers and contacts ----------
export const mockEvacuationCenters: EvacuationCenter[] = [
  { id: 1, name: 'Sample Evacuation Center A', address: 'Sample Street, Barangay Niog', latitude: 14.4, longitude: 120.96, capacity: 200, contact_person: 'Sample Person', contact_number: '0900-000-0001', is_open: true, notes: 'Ground floor accessible.' },
  { id: 2, name: 'Sample Evacuation Center B', address: 'Another Sample Street, Barangay Niog', latitude: null, longitude: null, capacity: 120, contact_person: null, contact_number: null, is_open: false, notes: null }
]

export const mockPublicEmergencyContacts: PublicEmergencyContact[] = [
  { id: 1, name: 'Sample BDRRMO Hotline', category: 'BDRRMO', number: '0900-000-0002' },
  { id: 2, name: 'Sample Fire Station', category: 'Fire', number: '0900-000-0003' },
  { id: 3, name: 'Sample Hospital', category: 'Hospital', number: '0900-000-0004' }
]

export const mockEmergencyContacts: EmergencyContact[] = mockPublicEmergencyContacts.map((c, i) => ({
  ...c, sort_order: i, is_active: true
}))

// ---------- Flood reports ----------
export const mockFloodReports: Paged<FloodReport> = {
  total: 1,
  items: [
    {
      id: 1, reported_at: hoursAgo(1), flooded_areas: 'Sample Street 1, Sample Street 2',
      passable_roads: 'Main road', impassable_roads: 'Sample Street 2',
      families_evacuated: 12, individuals_evacuated: 48, remarks: 'Sample remark.', created_by_name: 'Sample Staff'
    }
  ]
}

// ---------- Users and subscribers ----------
export const mockMe: Me = {
  id: '00000000-0000-0000-0000-0000000000aa',
  email: 'sample.secretary@example.com',
  full_name: 'Sample Barangay Secretary',
  position_title: 'Barangay Secretary',
  role: 'admin'
}

export const mockMeDisasterAdmin: Me = {
  id: '00000000-0000-0000-0000-0000000000dd',
  email: 'sample.kagawad@example.com',
  full_name: 'Sample Disaster Kagawad',
  position_title: 'Kagawad, Committee on Disaster',
  role: 'admin'
}

export const mockMeStaff: Me = {
  id: '00000000-0000-0000-0000-0000000000ee',
  email: 'sample.staff@example.com',
  full_name: 'Sample Staff',
  position_title: 'Barangay Clerk',
  role: 'staff'
}

export const mockUsers: UserRecord[] = [
  { ...mockMe, is_active: true, created_at: hoursAgo(72) },
  { ...mockMeDisasterAdmin, is_active: true, created_at: hoursAgo(60) },
  {
    ...mockMeStaff,
    created_at: hoursAgo(48)
  }
]

export const mockSubscribers: Paged<Subscriber> = {
  total: 1,
  items: [
    { id: '00000000-0000-0000-0000-0000000000cc', full_name: 'Sample Resident', phone_number: '09000000005', purok_street: 'Sample Purok 1', is_active: true, consented_at: hoursAgo(24), created_at: hoursAgo(24) }
  ]
}
