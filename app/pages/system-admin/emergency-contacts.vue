<script setup lang="ts">
import Swal from 'sweetalert2'
import type {
  EmergencyContact,
  EmergencyContactInput
} from '~~/shared/types/api'

type ContactForm = {
  name: string
  category: string
  number: string
  sort_order: number | ''
  is_active: boolean
}

definePageMeta({
  layout: 'system-admin',
  middleware: 'admin',
  allowedRoles: ['admin']
})

const {
  contacts,
  pending,
  busy,
  errorMessage,
  create,
  update,
  remove
} = useEmergencyContactsAdmin()

const emptyForm = (): ContactForm => ({
  name: '',
  category: '',
  number: '',
  sort_order: 0,
  is_active: true
})

const form = reactive<ContactForm>(emptyForm())
const mutationError = ref('')
const sortOrderTouched = ref(false)
const nextSortOrder = computed(() => {
  const highestSortOrder = contacts.value.reduce(
    (highest, contact) => Math.max(highest, contact.sort_order),
    -1
  )
  return Math.min(highestSortOrder + 1, 10_000)
})

watch(contacts, () => {
  if (!sortOrderTouched.value) form.sort_order = nextSortOrder.value
}, { immediate: true })

const markSortOrderEdited = () => {
  sortOrderTouched.value = true
}

const requestErrorMessage = (error: unknown, fallback: string) => {
  const typedError = error as {
    status?: number
    statusCode?: number
    data?: { statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  if (typedError.statusCode === 403 || typedError.status === 403) {
    return "You don't have access to emergency contact management."
  }
  return typedError.data?.statusMessage
    ?? typedError.statusMessage
    ?? typedError.message
    ?? fallback
}

const validateForm = (values: ContactForm): string | null => {
  const nameLength = values.name.trim().length
  if (nameLength < 1 || nameLength > 100) return 'name must be 1 to 100 characters'
  if (values.category.length > 50) return 'category must be at most 50 characters'
  const numberLength = values.number.trim().length
  if (numberLength < 1 || numberLength > 40) return 'number must be 1 to 40 characters'

  if (values.sort_order !== ''
    && (!Number.isInteger(values.sort_order) || values.sort_order < 0 || values.sort_order > 10_000)) {
    return 'sort_order must be a whole number from 0 to 10000'
  }

  return null
}

const getPayload = (values: ContactForm): EmergencyContactInput => ({
  name: values.name.trim(),
  category: values.category.trim() || null,
  number: values.number,
  sort_order: values.sort_order === '' ? 0 : values.sort_order,
  is_active: values.is_active
})

const escapeHtml = (value: string | number | null) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const submit = async () => {
  mutationError.value = validateForm(form) ?? ''
  if (mutationError.value) return

  try {
    await create(getPayload(form))
    sortOrderTouched.value = false
    Object.assign(form, emptyForm())
    form.sort_order = nextSortOrder.value
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to save the emergency contact.')
  }
}

const editContact = async (contact: EmergencyContact) => {
  mutationError.value = ''
  const result = await Swal.fire<EmergencyContactInput>({
    title: 'Edit emergency contact',
    html: `
      <div class="swal-center-form">
        <label for="edit-contact-name">Name *
          <input id="edit-contact-name" class="swal2-input" maxlength="100" required value="${escapeHtml(contact.name)}">
        </label>
        <label for="edit-contact-category">Category
          <input id="edit-contact-category" class="swal2-input" maxlength="50" value="${escapeHtml(contact.category)}">
        </label>
        <label for="edit-contact-number">Number *
          <input id="edit-contact-number" class="swal2-input" type="text" maxlength="40" required value="${escapeHtml(contact.number)}">
        </label>
        <label for="edit-contact-sort-order">Sort order
          <input id="edit-contact-sort-order" class="swal2-input" type="number" min="0" max="10000" step="1" value="${contact.sort_order}">
        </label>
        <label class="publish-field center-open-toggle">
          <input id="edit-contact-is-active" type="checkbox" ${contact.is_active ? 'checked' : ''}>
          Active and visible to residents
        </label>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save changes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83',
    focusConfirm: false,
    preConfirm: () => {
      const popup = Swal.getPopup()
      if (!popup) return false

      const name = popup.querySelector<HTMLInputElement>('#edit-contact-name')
      const category = popup.querySelector<HTMLInputElement>('#edit-contact-category')
      const number = popup.querySelector<HTMLInputElement>('#edit-contact-number')
      const sortOrder = popup.querySelector<HTMLInputElement>('#edit-contact-sort-order')
      const isActive = popup.querySelector<HTMLInputElement>('#edit-contact-is-active')

      if (!name || !category || !number || !sortOrder || !isActive) {
        Swal.showValidationMessage('Could not read the form. Please close and reopen the editor.')
        return false
      }

      const values: ContactForm = {
        name: name.value,
        category: category.value,
        number: number.value,
        sort_order: sortOrder.value.trim() ? Number(sortOrder.value) : '',
        is_active: isActive.checked
      }
      const validationMessage = validateForm(values)
      if (validationMessage) {
        Swal.showValidationMessage(validationMessage)
        return false
      }

      return getPayload(values)
    }
  })

  if (!result.isConfirmed || !result.value) return

  try {
    await update(contact.id, result.value)
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to update the emergency contact.')
  }
}

const toggleContact = async (contact: EmergencyContact, event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) return

  const toggle = event.target
  mutationError.value = ''
  try {
    await update(contact.id, { is_active: toggle.checked })
  } catch (error) {
    toggle.checked = contact.is_active
    mutationError.value = requestErrorMessage(error, 'Unable to update contact visibility.')
  }
}

const deleteContact = async (contact: EmergencyContact) => {
  mutationError.value = ''
  const confirmation = await Swal.fire({
    title: 'Are you sure?',
    text: `Permanently remove "${contact.name}"? To hide it from residents, mark it inactive instead.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6f7d83'
  })
  if (!confirmation.isConfirmed) return

  try {
    await remove(contact.id)
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to delete the emergency contact.')
  }
}
</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="mutationError" :message="mutationError" />

    <div class="two-column">
      <article class="panel form-panel">
        <span class="eyebrow">NEW CONTACT</span>
        <h2>Add an emergency contact</h2>
        <form @submit.prevent="submit">
          <label>
            Name *
            <input v-model="form.name" required maxlength="100" />
          </label>

          <label>
            Category
            <input v-model="form.category" maxlength="50" />
          </label>

          <label>
            Number *
            <input v-model="form.number" type="text" required maxlength="40" autocomplete="tel" />
          </label>

          <label>
            Sort order
            <input
              v-model.number="form.sort_order"
              type="number"
              min="0"
              max="10000"
              step="1"
              @input="markSortOrderEdited"
            />
          </label>

          <label class="publish-field center-open-toggle">
            <input v-model="form.is_active" type="checkbox" />
            Active and visible to residents
          </label>

          <div class="announcement-submit-actions">
            <button class="button primary-button" type="submit" :disabled="busy">
              {{ busy ? 'Saving...' : 'Create contact' }}
            </button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">EMERGENCY CONTACTS</span>
            <h2>Manage contacts</h2>
          </div>
        </div>

        <ErrorNotice v-if="errorMessage" :message="errorMessage" />
        <div v-else-if="pending" class="alert-state">Loading emergency contacts...</div>
        <div v-else-if="contacts.length === 0" class="alert-state">No emergency contacts yet.</div>

        <div v-else class="report-list">
          <div v-for="contact in contacts" :key="contact.id" class="report-item">
            <div class="item-between">
              <div>
                <strong>{{ contact.name }}</strong>
                <p>{{ contact.category || 'No category' }}</p>
                <p class="contact-number">{{ contact.number }}</p>
                <small>Sort order: {{ contact.sort_order }}</small>
              </div>
              <span class="tag" :class="contact.is_active ? 'announcement-status' : 'announcement-status draft'">
                {{ contact.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div class="center-actions">
              <label class="publish-field center-open-toggle">
                <input
                  type="checkbox"
                  role="switch"
                  :checked="contact.is_active"
                  :disabled="busy"
                  @change="toggleContact(contact, $event)"
                />
                {{ contact.is_active ? 'Visible to residents' : 'Hidden from residents' }}
              </label>
              <div class="announcement-actions">
                <button class="button secondary" type="button" :disabled="busy" @click="editContact(contact)">Edit</button>
                <button
                  class="button"
                  type="button"
                  :disabled="busy"
                  style="background:#fee2e2;color:#b91c1c"
                  @click="deleteContact(contact)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
