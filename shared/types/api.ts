// =====================================================================
// NioGabay API types  (contract v0.1)
// The real API routes return EXACTLY these shapes.
//
// Use in any file:
//   import type { FloodStatus } from '~~/shared/types/api'
//
// =====================================================================

// ---------- Basics ----------

/** Timestamps are ISO 8601 strings in UTC, e.g. "2026-11-10T01:23:45.000Z". Show them in Asia/Manila. */
export type ISODate = string

/** The four real alert levels. Their thresholds (in ft) live in the database and can change. */
export type AlertCode = 'yellow' | 'evacuation' | 'orange' | 'red'

/** What the water is currently doing. 'normal' = below the lowest threshold. */
export type AlertLevelCode = 'normal' | AlertCode

/** Lowest to highest. Use it to compare levels: ALERT_ORDER.indexOf(a) > ALERT_ORDER.indexOf(b) */
export const ALERT_ORDER: AlertLevelCode[] = ['normal', 'yellow', 'evacuation', 'orange', 'red']

export type Role = 'admin' | 'staff'
export type AnnouncementCategory = 'flood' | 'evacuation' | 'advisory' | 'general'
export type ReadingRange = '24h' | '7d' | '30d' | '90d'

/** Lists that can grow without limit come back in this wrapper. Ask with ?limit=20&offset=0 */
export interface Paged<T> {
  items: T[]
  /** total rows in the database, not just this page */
  total: number
}

/** Every failed request has an HTTP status and a message you can show the user. */
export interface ApiError {
  statusCode: number
  statusMessage: string
  message?: string
}

// ---------- Water level and alert levels ----------

export interface AlertLevel {
  id: number
  code: AlertCode
  label: string
  level_ft: number
  level_cm: number
  description: string | null
}

/** Current flood status. Public: this is what the resident-facing page shows. */
export interface FloodStatus {
  /** false when no reading arrived in the last 5 minutes. Then the level below may be OUT OF DATE. */
  sensor_online: boolean
  last_reading_at: ISODate | null
  /** null only if the sensor has never sent anything */
  water_level_cm: number | null
  water_level_ft: number | null
  alert_level: AlertLevelCode
  /** Text to display, e.g. "Normal", "Evacuation", or "No data" */
  alert_label: string
  /** All four thresholds, lowest first. Use them to draw the gauge; never hardcode 1/2/3/4 ft. */
  levels: AlertLevel[]
}

/** Same as FloodStatus plus technical details for the dashboard (staff and admin only). */
export interface StaffStatus extends FloodStatus {
  sensor: {
    id: string
    name: string
    location_description: string | null
    mount_height_cm: number | null
    is_active: boolean
  }
  latest_reading: {
    id: number
    distance_cm: number
    water_level_cm: number
    recorded_at: ISODate
  } | null
  /** alerts nobody has acknowledged yet */
  unacknowledged_alerts: number
}

/** One point on a chart. Each point is the HIGHEST level within its time slice, so peaks never hide. */
export interface ReadingPoint {
  t: ISODate
  water_level_cm: number
}

export interface ReadingsResponse {
  range: ReadingRange
  /** oldest first, at most 300 points */
  points: ReadingPoint[]
}

// ---------- Alerts ----------

export interface AlertRecord {
  id: number
  /** 'sensor' = created automatically, 'manual' = sent by an admin */
  source: 'sensor' | 'manual'
  /** null for a manual notice that has no level */
  alert_level: AlertLevelCode | null
  alert_label: string | null
  message: string
  /** water level at that moment; null for manual alerts */
  water_level_cm: number | null
  triggered_at: ISODate
  /** name of the admin who sent it; null for automatic alerts */
  created_by_name: string | null
  acknowledged_by_name: string | null
  acknowledged_at: ISODate | null
}

export interface ManualAlertInput {
  /** 1 to 320 characters */
  message: string
  alert_level: AlertCode | null
  send_sms: boolean
}

export interface AlertLevelPatch {
  /** must keep yellow < evacuation < orange < red */
  level_ft: number
}

// ---------- Announcements ----------

/** What residents see. Only published announcements, newest first. */
export interface PublicAnnouncement {
  id: number
  title: string
  body: string
  category: AnnouncementCategory
  published_at: ISODate
}

/** What staff see. Includes drafts (published_at = null). */
export interface Announcement {
  id: number
  title: string
  body: string
  category: AnnouncementCategory
  published_at: ISODate | null
  created_by_name: string | null
  created_at: ISODate
  updated_at: ISODate
}

export interface AnnouncementInput {
  /** 1 to 150 characters */
  title: string
  /** 1 to 5000 characters */
  body: string
  category: AnnouncementCategory
  /** true = publish now, false = save as draft */
  publish: boolean
}
export type AnnouncementPatch = Partial<AnnouncementInput>

// ---------- Evacuation centers and emergency contacts ----------

export interface EvacuationCenter {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  capacity: number | null
  contact_person: string | null
  contact_number: string | null
  /** true = currently open for evacuees */
  is_open: boolean
  notes: string | null
}
export type EvacuationCenterInput = Omit<EvacuationCenter, 'id'>

/** What residents see. */
export interface PublicEmergencyContact {
  id: number
  name: string
  /** e.g. "BDRRMO", "Fire", "Police", "Hospital" */
  category: string | null
  number: string
}

/** What admins manage. */
export interface EmergencyContact extends PublicEmergencyContact {
  sort_order: number
  is_active: boolean
}
export type EmergencyContactInput = Omit<EmergencyContact, 'id'>

// ---------- Flood reports (replaces the Messenger reports) ----------

export interface FloodReport {
  id: number
  reported_at: ISODate
  flooded_areas: string | null
  passable_roads: string | null
  impassable_roads: string | null
  families_evacuated: number
  individuals_evacuated: number
  remarks: string | null
  created_by_name: string | null
}

export interface FloodReportInput {
  /** leave out to use "now" */
  reported_at?: ISODate
  flooded_areas?: string | null
  passable_roads?: string | null
  impassable_roads?: string | null
  /** whole numbers, 0 or more */
  families_evacuated: number
  individuals_evacuated: number
  remarks?: string | null
}
export type FloodReportPatch = Partial<FloodReportInput>

// ---------- Login and users ----------

/** The logged-in person. */
export interface Me {
  id: string
  email: string
  full_name: string
  position_title: string | null
  role: Role
}

export interface LoginInput {
  email: string
  password: string
}

export interface UserRecord extends Me {
  is_active: boolean
  created_at: ISODate
}

export interface UserCreateInput {
  email: string
  /** at least 8 characters; the admin tells the person, who should change it */
  password: string
  full_name: string
  position_title?: string | null
  role: Role
}

export interface UserPatch {
  full_name?: string
  position_title?: string | null
  role?: Role
  is_active?: boolean
}

// ---------- SMS subscribers (residents) ----------

export interface SubscribeInput {
  full_name?: string | null
  /** 09171234567, +639171234567 or 639171234567. Spaces and dashes are fine. */
  phone_number: string
  purok_street?: string | null
  /** must be true (Data Privacy Act consent checkbox) */
  consent: boolean
}

/** Admin view of a subscriber. Residents never see this. */
export interface Subscriber {
  id: string
  full_name: string | null
  /** always stored as 09XXXXXXXXX */
  phone_number: string
  purok_street: string | null
  is_active: boolean
  consented_at: ISODate
  created_at: ISODate
}

export interface SubscriberPatch {
  is_active: boolean
}

/** Simple success answer used by routes that have nothing else to return. */
export interface Ok {
  ok: true
}
