import type { Role } from './types/api'

export type Capability =
  | 'view_dashboard'
  | 'acknowledge_alerts'
  | 'manage_flood_reports'
  | 'draft_announcements'
  | 'publish_announcements'
  | 'manage_evacuation_centers'
  | 'manage_emergency_contacts'
  | 'manage_users'

export const permissions: Record<Role, Capability[]> = {
  staff: ['view_dashboard', 'acknowledge_alerts', 'manage_flood_reports', 'draft_announcements'],
  admin: [
    'view_dashboard',
    'acknowledge_alerts',
    'manage_flood_reports',
    'draft_announcements',
    'publish_announcements',
    'manage_evacuation_centers',
    'manage_emergency_contacts',
    'manage_users'
  ]
}

export const can = (role: Role, capability: Capability) =>
  permissions[role].includes(capability)
