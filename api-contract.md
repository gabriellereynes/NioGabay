# NioGabay API Contract

**Version 0.1** · November 10, 2026 · Owner: Gabrielle Reynes (team leader)

This file says exactly what data every route sends and receives, so the public page, the staff dashboard, the server and the sensor can be built at the same time.

## 1. How to use this

- **Types:** `shared/types/api.ts` has the same shapes as TypeScript. Use `import type { FloodStatus } from '~~/shared/types/api'`.
- **Sample data:** `mocks/index.ts` has fake data in those shapes. Build and style your screens with it first, then switch to the real route when it is marked **Built**.
- **Changing a shape:** do not change it on your own. Tell the leader, then update this file, the types and the mocks together in one pull request.
- **Status labels:** **Built** means the route works now. **Planned** means it is not written yet; use the sample data.

## 2. Rules that apply everywhere

1. **All routes are under `/api`.** Requests and responses are JSON.
2. **Who can call a route depends on its URL prefix:**
   - `/api/public/...` needs no login.
   - `/api/staff/...` needs a logged-in **staff or admin**.
   - `/api/admin/...` needs a logged-in **admin**.
   - Not logged in gives **401**. Logged in but the wrong role gives **403**.
3. **Times** are ISO 8601 strings in UTC. Always show them in Philippine time:
   ```ts
   new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
   ```
4. **Units:** the server sends the water level in both `cm` and `ft`. The barangay thinks in feet, so show **feet** to people. Never convert yourselves.
5. **Alert levels** run lowest to highest: `normal` < `yellow` < `evacuation` < `orange` < `red`. The labels and thresholds come from the API and the admin can change them. **Never hardcode 1, 2, 3 or 4 ft in a screen.** Draw the gauge from the `levels` array.
6. **Sensor offline is a safety rule.** If `sensor_online` is `false`, the level on screen may be old. Both the public page and the dashboard **must** show a clear "No recent data, last update at ..." warning and must not present the level as live.
7. **Missing values are always `null`.** Fields are never left out, so you can rely on every key being there.
8. **Lists:** small fixed lists come back as a plain array. Lists that can grow come back as `{ "items": [...], "total": 123 }` and accept `?limit=20&offset=0` (default limit 20, maximum 100).
9. **Errors** have an HTTP status and a JSON body with `statusCode` and `statusMessage`. Show `statusMessage` to the user. Codes used: 400 (bad input), 401 (not logged in), 403 (not allowed), 404 (not found), 409 (conflict), 500 (server problem).
10. **Live data:** poll `status` every 10 seconds. Do not poll faster.

## 3. Who can do what

> **ASSUMED from Chapter 4. Please confirm with the Barangay Secretary.** Chapter 4 says the Secretary and the Kagawad on Disaster manage the system, while the Punong Barangay and clerks view data and provide updates.

| Action | Public | Staff | Admin |
|---|:--:|:--:|:--:|
| See current water level, announcements, evacuation centers, emergency contacts | ✓ | ✓ | ✓ |
| Subscribe to SMS alerts | ✓ | | |
| See dashboard, history chart, alert list, thresholds | | ✓ | ✓ |
| Acknowledge an alert | | ✓ | ✓ |
| Write announcements and flood reports | | ✓ | ✓ |
| Send a manual alert (with SMS) | | | ✓ |
| Change alert thresholds | | | ✓ |
| Manage evacuation centers and emergency contacts | | | ✓ |
| Manage users, view SMS subscribers | | | ✓ |

## 4. All routes at a glance

| Method | Route | Who | Status |
|---|---|---|---|
| POST | `/api/readings` | Sensor (device key) | **Built** |
| POST | `/api/auth/login` | Anyone | Planned |
| POST | `/api/auth/logout` | Logged in | Planned |
| GET | `/api/auth/me` | Logged in | Planned |
| GET | `/api/public/status` | Public | Planned |
| GET | `/api/public/readings` | Public | Planned |
| GET | `/api/public/announcements` | Public | Planned |
| GET | `/api/public/evacuation-centers` | Public | Planned |
| GET | `/api/public/emergency-contacts` | Public | Planned |
| POST | `/api/public/subscribe` | Public | Planned |
| GET | `/api/staff/status` | Staff, Admin | Planned |
| GET | `/api/staff/readings` | Staff, Admin | Planned |
| GET | `/api/staff/alert-levels` | Staff, Admin | Planned |
| GET | `/api/staff/alerts` | Staff, Admin | Planned |
| POST | `/api/staff/alerts/:id/acknowledge` | Staff, Admin | Planned |
| GET, POST | `/api/staff/announcements` | Staff, Admin | Planned |
| PATCH, DELETE | `/api/staff/announcements/:id` | Staff, Admin | Planned |
| GET, POST | `/api/staff/flood-reports` | Staff, Admin | Planned |
| PATCH | `/api/staff/flood-reports/:id` | Staff, Admin | Planned |
| PATCH | `/api/admin/alert-levels/:id` | Admin | Planned |
| POST | `/api/admin/alerts` | Admin | Planned |
| POST | `/api/admin/evacuation-centers` | Admin | Planned |
| PATCH, DELETE | `/api/admin/evacuation-centers/:id` | Admin | Planned |
| GET, POST | `/api/admin/emergency-contacts` | Admin | Planned |
| PATCH, DELETE | `/api/admin/emergency-contacts/:id` | Admin | Planned |
| GET, POST | `/api/admin/users` | Admin | Planned |
| PATCH | `/api/admin/users/:id` | Admin | Planned |
| GET | `/api/admin/subscribers` | Admin | Planned |
| PATCH | `/api/admin/subscribers/:id` | Admin | Planned |

## 5. Route details

### 5.1 Sensor (hardware member only)

#### `POST /api/readings`: **Built**

The ESP32 calls this every 10 to 60 seconds. Screens never call it.

Header: `x-api-key: <device key>`. Body:

<!-- type: { distance_cm: number } -->
```json
{ "distance_cm": 188.4 }
```

`distance_cm` is the distance from the sensor down to the water surface, from 0 to 500. Returns **201**:

```json
{ "id": 1042, "water_level_cm": 61.6, "alert_level": "yellow", "alert_created": false }
```

Errors: 400 (bad number), 401 (missing or wrong key), 409 (the sensor's mount height is not set yet).

### 5.2 Login

#### `POST /api/auth/login`

<!-- type: LoginInput -->
```json
{ "email": "sample.admin@example.com", "password": "correct-horse-battery" }
```

Returns **200** with the logged-in person (type `Me`). Wrong email or password gives 401, a deactivated account gives 403.

<!-- type: Me -->
```json
{
  "id": "00000000-0000-0000-0000-0000000000aa",
  "email": "sample.admin@example.com",
  "full_name": "Sample Admin",
  "position_title": "Barangay Secretary",
  "role": "admin"
}
```

#### `POST /api/auth/logout`

Returns `{ "ok": true }`.

#### `GET /api/auth/me`

Returns the same `Me` object, or **401** when nobody is logged in. Call it when the app starts to decide whether to redirect to the login page.

### 5.3 Public (no login)

#### `GET /api/public/status`

The current flood status. This is the main feed for the resident-facing page. Type `FloodStatus`.

<!-- type: FloodStatus -->
```json
{
  "sensor_online": true,
  "last_reading_at": "2026-11-10T01:23:45.000Z",
  "water_level_cm": 62,
  "water_level_ft": 2,
  "alert_level": "evacuation",
  "alert_label": "Evacuation",
  "levels": [
    { "id": 1, "code": "yellow", "label": "Yellow - Warning", "level_ft": 1, "level_cm": 30.5, "description": "Water reached 1 ft." },
    { "id": 2, "code": "evacuation", "label": "Evacuation", "level_ft": 2, "level_cm": 61, "description": "Start rescue and evacuation." },
    { "id": 3, "code": "orange", "label": "Orange - Alert", "level_ft": 3, "level_cm": 91.4, "description": "Assumed value." },
    { "id": 4, "code": "red", "label": "Red - Critical", "level_ft": 4, "level_cm": 121.9, "description": "Assumed value." }
  ]
}
```

- When the water is below the lowest threshold: `alert_level` is `"normal"` and `alert_label` is `"Normal"`.
- When the sensor has never sent anything: `water_level_cm`, `water_level_ft` and `last_reading_at` are `null`, `alert_level` is `"normal"` and `alert_label` is `"No data"`.
- `sensor_online` is `false` when no reading arrived in the last 5 minutes. See rule 6.

#### `GET /api/public/readings`

The last 24 hours for a small trend chart. Type `ReadingsResponse`. At most 300 points, oldest first. Each point is the highest level in its time slice, so peaks are never hidden.

<!-- type: ReadingsResponse -->
```json
{
  "range": "24h",
  "points": [
    { "t": "2026-11-09T02:00:00.000Z", "water_level_cm": 4.2 },
    { "t": "2026-11-09T02:10:00.000Z", "water_level_cm": 4.5 },
    { "t": "2026-11-09T02:20:00.000Z", "water_level_cm": 5.1 }
  ]
}
```

#### `GET /api/public/announcements?limit=10`

Published announcements only, newest first. A plain array of `PublicAnnouncement` (limit up to 50).

<!-- type: PublicAnnouncement[] -->
```json
[
  {
    "id": 2,
    "title": "Sample: Evacuation center now open",
    "body": "The sample evacuation center is open for families from low-lying areas.",
    "category": "evacuation",
    "published_at": "2026-11-10T01:00:00.000Z"
  }
]
```

`category` is one of `flood`, `evacuation`, `advisory`, `general`.

#### `GET /api/public/evacuation-centers`

All centers, open ones first. A plain array of `EvacuationCenter`.

<!-- type: EvacuationCenter[] -->
```json
[
  {
    "id": 1,
    "name": "Sample Evacuation Center A",
    "address": "Sample Street, Barangay Niog",
    "latitude": 14.4,
    "longitude": 120.96,
    "capacity": 200,
    "contact_person": "Sample Person",
    "contact_number": "0900-000-0001",
    "is_open": true,
    "notes": "Ground floor accessible."
  }
]
```

#### `GET /api/public/emergency-contacts`

Active contacts only, in the order the admin set. A plain array of `PublicEmergencyContact`.

<!-- type: PublicEmergencyContact[] -->
```json
[
  { "id": 1, "name": "Sample BDRRMO Hotline", "category": "BDRRMO", "number": "0900-000-0002" },
  { "id": 2, "name": "Sample Fire Station", "category": "Fire", "number": "0900-000-0003" }
]
```

#### `POST /api/public/subscribe`

A resident signs up for SMS alerts. Residents have no account.

<!-- type: SubscribeInput -->
```json
{
  "full_name": "Sample Resident",
  "phone_number": "0917 123 4567",
  "purok_street": "Sample Purok 1",
  "consent": true
}
```

- `consent` **must be `true`**. The form needs a checkbox that explains how the number is used (Data Privacy Act). Otherwise 400.
- `phone_number` may be `09171234567`, `+639171234567` or `639171234567`, with spaces or dashes. The server stores it as `09171234567`. A number that is not a Philippine mobile number gives 400.
- Returns **201** `{ "ok": true }`. A number that is already subscribed also returns 201, so nobody can use this form to find out who is subscribed.

### 5.4 Staff (login required, staff or admin)

#### `GET /api/staff/status`

Everything in `FloodStatus` plus technical details for the dashboard. Type `StaffStatus`.

<!-- type: StaffStatus -->
```json
{
  "sensor_online": true,
  "last_reading_at": "2026-11-10T01:23:45.000Z",
  "water_level_cm": 62,
  "water_level_ft": 2,
  "alert_level": "evacuation",
  "alert_label": "Evacuation",
  "levels": [
    { "id": 1, "code": "yellow", "label": "Yellow - Warning", "level_ft": 1, "level_cm": 30.5, "description": null },
    { "id": 2, "code": "evacuation", "label": "Evacuation", "level_ft": 2, "level_cm": 61, "description": null }
  ],
  "sensor": {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "NioGabay Sensor 1",
    "location_description": "Sample location, Barangay Niog",
    "mount_height_cm": 250,
    "is_active": true
  },
  "latest_reading": {
    "id": 1042,
    "distance_cm": 188,
    "water_level_cm": 62,
    "recorded_at": "2026-11-10T01:23:45.000Z"
  },
  "unacknowledged_alerts": 2
}
```

#### `GET /api/staff/readings?range=24h`

History for the dashboard chart. `range` is `24h`, `7d`, `30d` or `90d`. Same shape as the public route (`ReadingsResponse`) with the `range` you asked for.

#### `GET /api/staff/alert-levels`

The four thresholds as a plain array of `AlertLevel` (same objects as `levels` above).

#### `GET /api/staff/alerts?limit=20&offset=0`

Newest first. Type `Paged<AlertRecord>`.

<!-- type: Paged<AlertRecord> -->
```json
{
  "total": 2,
  "items": [
    {
      "id": 3,
      "source": "sensor",
      "alert_level": "evacuation",
      "alert_label": "Evacuation",
      "message": "Evacuation: water level is 62 cm (2 ft).",
      "water_level_cm": 62,
      "triggered_at": "2026-11-10T01:03:00.000Z",
      "created_by_name": null,
      "acknowledged_by_name": null,
      "acknowledged_at": null
    },
    {
      "id": 2,
      "source": "manual",
      "alert_level": "yellow",
      "alert_label": "Yellow - Warning",
      "message": "Sample notice: please prepare go-bags.",
      "water_level_cm": null,
      "triggered_at": "2026-11-10T00:38:00.000Z",
      "created_by_name": "Sample Admin",
      "acknowledged_by_name": "Sample Staff",
      "acknowledged_at": "2026-11-10T00:43:00.000Z"
    }
  ]
}
```

#### `POST /api/staff/alerts/:id/acknowledge`

No body. Marks the alert as seen by the logged-in person. Returns the updated `AlertRecord`. An unknown id gives 404.

#### `GET /api/staff/announcements?limit=20&offset=0`

All announcements including drafts (`published_at` is `null` for a draft). Newest first. Type `Paged<Announcement>`.

<!-- type: Paged<Announcement> -->
```json
{
  "total": 1,
  "items": [
    {
      "id": 3,
      "title": "Sample draft: Relief goods schedule",
      "body": "Not published yet.",
      "category": "general",
      "published_at": null,
      "created_by_name": "Sample Staff",
      "created_at": "2026-11-10T00:20:00.000Z",
      "updated_at": "2026-11-10T00:20:00.000Z"
    }
  ]
}
```

#### `POST /api/staff/announcements`

<!-- type: AnnouncementInput -->
```json
{
  "title": "Sample: Flood advisory",
  "body": "Water level is rising. Stay alert and follow barangay instructions.",
  "category": "flood",
  "publish": true
}
```

`title` is 1 to 150 characters and `body` is 1 to 5000. `publish: true` publishes now, `false` saves a draft. Returns **201** with the new `Announcement`.

#### `PATCH /api/staff/announcements/:id`

Send only the fields you want to change (`AnnouncementPatch`). `publish: true` publishes a draft and `publish: false` takes an announcement back to draft. Returns the updated `Announcement`.

#### `DELETE /api/staff/announcements/:id`

Returns `{ "ok": true }`.

#### `GET /api/staff/flood-reports?limit=20&offset=0`

Newest first. Type `Paged<FloodReport>`. This replaces the free-form Messenger reports with one fixed format.

<!-- type: Paged<FloodReport> -->
```json
{
  "total": 1,
  "items": [
    {
      "id": 1,
      "reported_at": "2026-11-10T00:23:00.000Z",
      "flooded_areas": "Sample Street 1, Sample Street 2",
      "passable_roads": "Main road",
      "impassable_roads": "Sample Street 2",
      "families_evacuated": 12,
      "individuals_evacuated": 48,
      "remarks": "Sample remark.",
      "created_by_name": "Sample Staff"
    }
  ]
}
```

#### `POST /api/staff/flood-reports`

<!-- type: FloodReportInput -->
```json
{
  "flooded_areas": "Sample Street 1",
  "passable_roads": "Main road",
  "impassable_roads": "Sample Street 2",
  "families_evacuated": 12,
  "individuals_evacuated": 48,
  "remarks": null
}
```

`reported_at` is optional and defaults to now. The two evacuee counts are whole numbers, 0 or more. Returns **201** with the new `FloodReport`.

#### `PATCH /api/staff/flood-reports/:id`

Send only the fields to change (`FloodReportPatch`). Returns the updated `FloodReport`. Reports cannot be deleted, so the records stay complete.

### 5.5 Admin (login required, admin only)

#### `PATCH /api/admin/alert-levels/:id`

<!-- type: AlertLevelPatch -->
```json
{ "level_ft": 3.5 }
```

Returns the updated `AlertLevel`. The order must stay yellow < evacuation < orange < red, or the server answers 400.

#### `POST /api/admin/alerts`

Sends a manual alert. It appears in the alert list, and when `send_sms` is `true` it will also text every active subscriber.

<!-- type: ManualAlertInput -->
```json
{
  "message": "Sample notice: please prepare go-bags and move valuables upstairs.",
  "alert_level": "yellow",
  "send_sms": false
}
```

`message` is 1 to 320 characters. `alert_level` may be `null` for a general notice. Returns **201** with the new `AlertRecord`. Until the SMS service is connected, `send_sms: true` is accepted but nothing is sent.

#### Evacuation centers

`POST /api/admin/evacuation-centers`, `PATCH /api/admin/evacuation-centers/:id` and `DELETE /api/admin/evacuation-centers/:id`. To list centers, use the public route above.

<!-- type: EvacuationCenterInput -->
```json
{
  "name": "Sample Evacuation Center B",
  "address": "Another Sample Street, Barangay Niog",
  "latitude": null,
  "longitude": null,
  "capacity": 120,
  "contact_person": null,
  "contact_number": null,
  "is_open": false,
  "notes": null
}
```

`POST` returns **201** with the new `EvacuationCenter`, `PATCH` takes any of those fields and returns the updated one, and `DELETE` returns `{ "ok": true }`.

#### Emergency contacts

`GET /api/admin/emergency-contacts` returns an array of `EmergencyContact` including inactive ones. `POST` (201), `PATCH /:id` and `DELETE /:id` work like the evacuation centers.

<!-- type: EmergencyContactInput -->
```json
{
  "name": "Sample Police Station",
  "category": "Police",
  "number": "0900-000-0005",
  "sort_order": 3,
  "is_active": true
}
```

#### Users

`GET /api/admin/users` returns an array of `UserRecord`.

<!-- type: UserRecord[] -->
```json
[
  {
    "id": "00000000-0000-0000-0000-0000000000bb",
    "email": "sample.staff@example.com",
    "full_name": "Sample Staff",
    "position_title": "Barangay Clerk",
    "role": "staff",
    "is_active": true,
    "created_at": "2026-11-08T01:00:00.000Z"
  }
]
```

`POST /api/admin/users` creates a login:

<!-- type: UserCreateInput -->
```json
{
  "email": "new.staff@example.com",
  "password": "at-least-8-characters",
  "full_name": "New Staff",
  "position_title": "Barangay Clerk",
  "role": "staff"
}
```

Returns **201** with the new `UserRecord`. An email that already exists gives 409.

`PATCH /api/admin/users/:id` takes any of `full_name`, `position_title`, `role`, `is_active` (`UserPatch`) and returns the updated `UserRecord`. An admin cannot demote or deactivate their own account (400), so the barangay can never be locked out.

#### SMS subscribers

`GET /api/admin/subscribers?limit=20&offset=0` returns `Paged<Subscriber>`.

<!-- type: Paged<Subscriber> -->
```json
{
  "total": 1,
  "items": [
    {
      "id": "00000000-0000-0000-0000-0000000000cc",
      "full_name": "Sample Resident",
      "phone_number": "09000000005",
      "purok_street": "Sample Purok 1",
      "is_active": true,
      "consented_at": "2026-11-09T01:00:00.000Z",
      "created_at": "2026-11-09T01:00:00.000Z"
    }
  ]
}
```

`PATCH /api/admin/subscribers/:id` with `{ "is_active": false }` stops texts to that number. Returns the updated `Subscriber`.

## 6. Open decisions

Everything here is an assumption that may change. Say so if you disagree.

1. **Orange (3 ft) and red (4 ft)** are placeholders until the barangay gives the real values.
2. **The permission table in section 3** is our reading of Chapter 4.
3. **How login works** (Supabase Auth or a cookie library) is the leader's choice. Screens only use the three `/api/auth/...` routes, so this will not affect them.
4. **The offline limit** (5 minutes without a reading) may be tuned once the real sensor's sending interval is known.
5. **SMS opt-out:** residents can currently only be removed by an admin. Replying STOP would be better, and may be future work.
6. **Public history is 24 hours only.** Longer history is staff-only, following the Punong Barangay's duty in Chapter 4.

## 7. Changelog

| Date | Change |
|---|---|
| 2026-11-10 | v0.1 first draft |
