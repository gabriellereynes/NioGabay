<script setup lang="ts">
// Admin only. Opens at /system-admin/users. Data and requests live in app/composables/useUsersAdmin.ts.
// Same conventions as the announcements page: system-admin layout, 'admin' middleware, shared
// classes (panel, eyebrow, button, tag, report-item...), SweetAlert2 for confirm and edit.
import Swal from 'sweetalert2'
import type { Role, UserPatch, UserRecord } from '~~/shared/types/api'

definePageMeta({ layout: 'system-admin', middleware: 'admin', allowedRoles: ['admin'] })

const { items, pending, busy, errorMessage, statusCode, isMe, create, update, formatManila } = useUsersAdmin()

const form = reactive({
  email: '',
  password: '',
  full_name: '',
  position_title: '',
  role: 'staff' as Role
})
const mutationError = ref('')
const successMessage = ref('')

const requestErrorMessage = (error: unknown, fallback: string) => {
  const typedError = error as {
    data?: { statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  return typedError.data?.statusMessage
    ?? typedError.statusMessage
    ?? typedError.message
    ?? fallback
}

const submit = async () => {
  mutationError.value = ''
  successMessage.value = ''
  const name = form.full_name.trim()
  const position = form.position_title.trim()
  if (!name || name.length > 100) {
    mutationError.value = 'full_name must be 1 to 100 characters'
    return
  }
  if (position.length > 100) {
    mutationError.value = 'position_title must be 100 characters or fewer'
    return
  }
  if (form.password.length < 8 || form.password.length > 72) {
    mutationError.value = 'password must be 8 to 72 characters'
    return
  }

  try {
    await create({
      email: form.email.trim(),
      password: form.password,
      full_name: name,
      position_title: position || null,
      role: form.role
    })
    successMessage.value = `Account created for ${name}. Give them the password privately.`
    Object.assign(form, { email: '', password: '', full_name: '', position_title: '', role: 'staff' })
  } catch (error) {
    // 409 = email already used, 400 = weak password or invalid email. The server's text is readable.
    mutationError.value = requestErrorMessage(error, 'Unable to create the account.')
    form.password = ''
  }
}

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const editUser = async (person: UserRecord) => {
  mutationError.value = ''
  successMessage.value = ''
  const self = isMe(person.id)
  const result = await Swal.fire({
    title: 'Edit account',
    html: `
      <div class="swal-form">
        <label>Full name
          <input id="user-name" class="swal2-input" maxlength="100" value="${escapeHtml(person.full_name)}">
        </label>
        <label>Position (leave empty to clear)
          <input id="user-position" class="swal2-input" maxlength="100" value="${escapeHtml(person.position_title)}">
        </label>
        <label>Role
          <select id="user-role" class="swal2-input" ${self ? 'disabled' : ''}>
            <option value="staff" ${person.role === 'staff' ? 'selected' : ''}>Staff</option>
            <option value="admin" ${person.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </label>
        ${self ? '<small>You cannot change your own role.</small>' : ''}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save changes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83',
    preConfirm: () => {
      const full_name = (document.getElementById('user-name') as HTMLInputElement).value.trim()
      const position_title = (document.getElementById('user-position') as HTMLInputElement).value.trim()
      const role = (document.getElementById('user-role') as HTMLSelectElement).value as Role
      if (!full_name || full_name.length > 100) {
        Swal.showValidationMessage('full_name must be 1 to 100 characters')
        return false
      }
      if (position_title.length > 100) {
        Swal.showValidationMessage('position_title must be 100 characters or fewer')
        return false
      }
      return { full_name, position_title, role }
    }
  })

  if (!result.isConfirmed || !result.value) return

  const values = result.value as { full_name: string; position_title: string; role: Role }
  const patch: UserPatch = {}
  if (values.full_name !== person.full_name) patch.full_name = values.full_name
  if ((values.position_title || null) !== person.position_title) patch.position_title = values.position_title || null // null clears it
  if (!self && values.role !== person.role) patch.role = values.role
  if (Object.keys(patch).length === 0) return

  try {
    await update(person.id, patch)
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to update the account.')
  }
}

const toggleActive = async (person: UserRecord) => {
  mutationError.value = ''
  successMessage.value = ''
  if (person.is_active) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Deactivate ${person.full_name}? They are locked out right away, even if logged in. You can reactivate them later.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6f7d83'
    })
    if (!result.isConfirmed) return
  }

  try {
    await update(person.id, { is_active: !person.is_active })
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to update the account.')
  }
}
</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="mutationError" :message="mutationError" />
    <ErrorNotice v-else-if="statusCode === 403" message="Only an admin can manage accounts." />
    <div v-if="successMessage" class="offline-notice">{{ successMessage }}</div>

    <div class="two-column">
      <article class="panel form-panel">
        <span class="eyebrow">NEW ACCOUNT</span>
        <h2>Create an account</h2>
        <form @submit.prevent="submit">
          <label>
            Email
            <input v-model="form.email" type="email" required autocomplete="off" />
          </label>

          <label>
            Password
            <input v-model="form.password" type="password" required minlength="8" maxlength="72" autocomplete="new-password" />
          </label>
          <div class="field-counter">8 to 72 characters. Give it to the person privately. It is never shown again.</div>

          <label>
            Full name
            <input v-model="form.full_name" required maxlength="100" />
          </label>
          <div class="field-counter">{{ form.full_name.length }} / 100</div>

          <label>
            Position (optional)
            <input v-model="form.position_title" maxlength="100" />
          </label>

          <label>
            Role
            <select v-model="form.role">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div class="announcement-submit-actions">
            <button class="button primary-button" type="submit" :disabled="busy">
              {{ busy ? 'Saving...' : 'Create account' }}
            </button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">ACCOUNTS</span>
            <h2>People who can log in</h2>
          </div>
        </div>

        <ErrorNotice v-if="errorMessage" :message="errorMessage" />

        <div v-else-if="pending && items.length === 0" class="alert-state">Loading accounts...</div>

        <div v-else-if="items.length === 0" class="alert-state">No accounts yet</div>

        <div v-else class="report-list">
          <div v-for="person in items" :key="person.id" class="report-item">
            <div class="item-between">
              <strong>{{ person.full_name }}<template v-if="isMe(person.id)"> (you)</template></strong>
              <span>
                <span class="tag">{{ person.role === 'admin' ? 'Admin' : 'Staff' }}</span>
                <span class="tag announcement-status" :class="{ draft: !person.is_active }">
                  {{ person.is_active ? 'Active' : 'Deactivated' }}
                </span>
              </span>
            </div>
            <p>{{ person.email }}<template v-if="person.position_title"> · {{ person.position_title }}</template></p>
            <div class="item-between">
              <div>
                <small>Added {{ formatManila(person.created_at) || 'Date unavailable' }}</small>
              </div>
              <div class="announcement-actions">
                <button class="button secondary" type="button" :disabled="busy" @click="editUser(person)">Edit</button>
                <button
                  v-if="!isMe(person.id)"
                  class="button secondary"
                  type="button"
                  :disabled="busy"
                  @click="toggleActive(person)"
                >
                  {{ person.is_active ? 'Deactivate' : 'Reactivate' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>