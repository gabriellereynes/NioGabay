// Admin only: the list of accounts, plus create and edit.
//
//   const { items, pending, busy, errorMessage, statusCode, isMe, create, update, formatManila } = useUsersAdmin()
//
// Same pattern as useAnnouncementsAdmin: create() and update() THROW the server's error, so the page
// catches it and shows error.data.statusMessage. Accounts are never deleted, only deactivated.
//
// Routes (docs/api-contract.md): GET /api/admin/users, POST /api/admin/users, PATCH /api/admin/users/:id
// The password is only passed to the server. It is never kept here.
import type { UserCreateInput, UserPatch, UserRecord } from '~~/shared/types/api'

export const useUsersAdmin = () => {
  // nuxt-auth-utils: the logged-in person's session. Its user holds the id (and email).
  const { user } = useUserSession()

  const { data, error, pending, refresh } = useFetch<UserRecord[]>('/api/admin/users', {
    key: 'admin-users',
    default: () => []
  })

  const items = computed<UserRecord[]>(() => data.value ?? [])

  const statusCode = computed<number | null>(() => {
    const e = error.value as { statusCode?: number; status?: number } | null
    return e ? (e.statusCode ?? e.status ?? null) : null
  })

  const errorMessage = computed<string | null>(() => {
    const e = error.value as { statusMessage?: string; message?: string } | null
    return e ? (e.statusMessage ?? e.message ?? 'Could not load the accounts.') : null
  })

  /** True while a create or update request is running (use it to disable the buttons). */
  const busy = ref(false)

  /** Your own row: the server refuses to demote or deactivate yourself, so hide those controls. */
  const isMe = (id: string): boolean => (user.value as { id?: string } | null)?.id === id

  const create = async (input: UserCreateInput): Promise<UserRecord> => {
    busy.value = true
    try {
      const created = await $fetch<UserRecord>('/api/admin/users', { method: 'POST', body: input })
      await refresh()
      return created
    } finally {
      busy.value = false
    }
  }

  /** Send only the fields that changed. */
  const update = async (id: string, patch: UserPatch): Promise<UserRecord> => {
    busy.value = true
    try {
      const updated = await $fetch<UserRecord>(`/api/admin/users/${id}`, { method: 'PATCH', body: patch })
      await refresh()
      return updated
    } finally {
      busy.value = false
    }
  }

  /** ISO time -> Philippine time, for example "November 19, 2026 at 4:34 PM". */
  const formatManila = (value: string | null | undefined): string => {
    if (!value) return ''
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(value))
  }

  return { items, pending, busy, errorMessage, statusCode, isMe, create, update, formatManila }
}
