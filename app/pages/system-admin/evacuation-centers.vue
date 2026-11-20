<script setup lang="ts">
import Swal from 'sweetalert2'
import type {
  EvacuationCenter,
  EvacuationCenterInput
} from '~~/shared/types/api'

type OptionalNumber = number | '' | null
type CenterForm = Omit<EvacuationCenterInput, 'latitude' | 'longitude' | 'capacity'> & {
  latitude: OptionalNumber
  longitude: OptionalNumber
  capacity: OptionalNumber
}

definePageMeta({
  layout: 'system-admin',
  middleware: 'admin',
  allowedRoles: ['admin']
})

const {
  centers,
  pending,
  busy,
  errorMessage,
  statusCode,
  create,
  update,
  remove
} = useEvacuationCentersAdmin()

const emptyForm = (): CenterForm => ({
  name: '',
  address: '',
  latitude: null,
  longitude: null,
  capacity: null,
  contact_person: '',
  contact_number: '',
  is_open: false,
  notes: ''
})

const form = reactive<CenterForm>(emptyForm())
const mutationError = ref('')

const requestErrorMessage = (error: unknown, fallback: string) => {
  const typedError = error as {
    status?: number
    statusCode?: number
    data?: { statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  if (typedError.statusCode === 403 || typedError.status === 403) {
    return "You don't have access to evacuation center management."
  }
  return typedError.data?.statusMessage
    ?? typedError.statusMessage
    ?? typedError.message
    ?? fallback
}

const optionalText = (value: string) => value.trim() || null
const optionalNumber = (value: OptionalNumber): number | null =>
  value === '' || value === null ? null : value

const validateForm = (values: CenterForm = form): string | null => {
  const name = values.name.trim()
  if (name.length < 1 || name.length > 120) return 'name must be 1 to 120 characters'
  if (values.address.length > 300) return 'address must be 300 characters or fewer'
  if (values.contact_person.length > 100) return 'contact_person must be 100 characters or fewer'
  if (values.contact_number.length > 40) return 'contact_number must be 40 characters or fewer'
  if (values.notes.length > 1000) return 'notes must be 1000 characters or fewer'

  if (values.latitude !== '' && values.latitude !== null
    && (!Number.isFinite(values.latitude) || values.latitude < -90 || values.latitude > 90)) {
    return 'latitude must be between -90 and 90'
  }
  if (values.longitude !== '' && values.longitude !== null
    && (!Number.isFinite(values.longitude) || values.longitude < -180 || values.longitude > 180)) {
    return 'longitude must be between -180 and 180'
  }
  if (values.capacity !== '' && values.capacity !== null
    && (!Number.isInteger(values.capacity) || values.capacity < 0 || values.capacity > 100_000)) {
    return 'capacity must be a whole number between 0 and 100000'
  }

  return null
}

const getPayload = (values: CenterForm): EvacuationCenterInput => ({
  name: values.name.trim(),
  address: optionalText(values.address),
  latitude: optionalNumber(values.latitude),
  longitude: optionalNumber(values.longitude),
  capacity: optionalNumber(values.capacity),
  contact_person: optionalText(values.contact_person),
  contact_number: optionalText(values.contact_number),
  is_open: values.is_open,
  notes: optionalText(values.notes)
})

const escapeHtml = (value: string | number | null) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const summaryRow = (label: string, value: string | number | null) => `
  <div class="swal-center-summary-row">
    <strong>${escapeHtml(label)}</strong>
    <span>${value === null || value === '' ? 'Not provided' : escapeHtml(value)}</span>
  </div>
`

const summaryHtml = (center: EvacuationCenterInput) => `
  <div class="swal-center-summary">
    ${summaryRow('Name', center.name)}
    ${summaryRow('Address', center.address)}
    ${summaryRow('Latitude', center.latitude)}
    ${summaryRow('Longitude', center.longitude)}
    ${summaryRow('Capacity', center.capacity)}
    ${summaryRow('Contact person', center.contact_person)}
    ${summaryRow('Contact number', center.contact_number)}
    ${summaryRow('Availability', center.is_open ? 'Open' : 'Closed')}
    ${summaryRow('Notes', center.notes)}
  </div>
`

const submit = async () => {
  mutationError.value = validateForm() ?? ''
  if (mutationError.value) return

  const payload = getPayload(form)
  const confirmation = await Swal.fire({
    title: 'Confirm evacuation center details',
    html: summaryHtml(payload),
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83'
  })
  if (!confirmation.isConfirmed) return

  try {
    await create(payload)
    Object.assign(form, emptyForm())
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to save the evacuation center.')
  }
}

const editCenter = async (center: EvacuationCenter) => {
  mutationError.value = ''
  const result = await Swal.fire<EvacuationCenterInput>({
    title: 'Edit evacuation center',
    html: `
      <div class="swal-center-form">
        <label for="edit-center-name">Name *
          <input id="edit-center-name" class="swal2-input" maxlength="120" required value="${escapeHtml(center.name)}">
        </label>
        <label for="edit-center-address">Address
          <input id="edit-center-address" class="swal2-input" maxlength="300" value="${escapeHtml(center.address)}">
        </label>
        <div class="swal-center-form-row">
          <label for="edit-center-latitude">Latitude
            <input id="edit-center-latitude" class="swal2-input" type="number" min="-90" max="90" step="any" value="${center.latitude ?? ''}">
          </label>
          <label for="edit-center-longitude">Longitude
            <input id="edit-center-longitude" class="swal2-input" type="number" min="-180" max="180" step="any" value="${center.longitude ?? ''}">
          </label>
        </div>
        <label for="edit-center-capacity">Capacity
          <input id="edit-center-capacity" class="swal2-input" type="number" min="0" max="100000" step="1" value="${center.capacity ?? ''}">
        </label>
        <div class="swal-center-form-row">
          <label for="edit-center-contact-person">Contact person
            <input id="edit-center-contact-person" class="swal2-input" maxlength="100" value="${escapeHtml(center.contact_person)}">
          </label>
          <label for="edit-center-contact-number">Contact number
            <input id="edit-center-contact-number" class="swal2-input" maxlength="40" value="${escapeHtml(center.contact_number)}">
          </label>
        </div>
        <label for="edit-center-notes">Notes
          <textarea id="edit-center-notes" class="swal2-textarea" maxlength="1000" rows="4">${escapeHtml(center.notes)}</textarea>
        </label>
        <label class="publish-field center-open-toggle">
          <input id="edit-center-is-open" type="checkbox" ${center.is_open ? 'checked' : ''}>
          Open to evacuees
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

      const name = popup.querySelector<HTMLInputElement>('#edit-center-name')
      const address = popup.querySelector<HTMLInputElement>('#edit-center-address')
      const latitude = popup.querySelector<HTMLInputElement>('#edit-center-latitude')
      const longitude = popup.querySelector<HTMLInputElement>('#edit-center-longitude')
      const capacity = popup.querySelector<HTMLInputElement>('#edit-center-capacity')
      const contactPerson = popup.querySelector<HTMLInputElement>('#edit-center-contact-person')
      const contactNumber = popup.querySelector<HTMLInputElement>('#edit-center-contact-number')
      const notes = popup.querySelector<HTMLTextAreaElement>('#edit-center-notes')
      const isOpen = popup.querySelector<HTMLInputElement>('#edit-center-is-open')

      if (!name || !address || !latitude || !longitude || !capacity
        || !contactPerson || !contactNumber || !notes || !isOpen) {
        Swal.showValidationMessage('Could not read the form. Please close and reopen the editor.')
        return false
      }

      const values: CenterForm = {
        name: name.value,
        address: address.value,
        latitude: latitude.value.trim() ? Number(latitude.value) : null,
        longitude: longitude.value.trim() ? Number(longitude.value) : null,
        capacity: capacity.value.trim() ? Number(capacity.value) : null,
        contact_person: contactPerson.value,
        contact_number: contactNumber.value,
        is_open: isOpen.checked,
        notes: notes.value
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
    await update(center.id, result.value)
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to update the evacuation center.')
  }
}

const toggleCenter = async (center: EvacuationCenter, event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) return

  const toggle = event.target
  const isOpen = toggle.checked
  mutationError.value = ''
  try {
    await update(center.id, { is_open: isOpen })
  } catch (error) {
    toggle.checked = center.is_open
    mutationError.value = requestErrorMessage(error, 'Unable to update center availability.')
  }
}

const deleteCenter = async (center: EvacuationCenter) => {
  mutationError.value = ''
  const confirmation = await Swal.fire({
    title: 'Are you sure?',
    text: `Permanently remove "${center.name}"? To keep it listed but unavailable, close it instead.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6f7d83'
  })
  if (!confirmation.isConfirmed) return

  try {
    await remove(center.id)
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to delete the evacuation center.')
  }
}
</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="mutationError" :message="mutationError" />
    <ErrorNotice
      v-else-if="statusCode === 403"
      message="You don't have access to evacuation center management."
    />

    <div class="two-column">
      <article class="panel form-panel">
        <span class="eyebrow">NEW CENTER</span>
        <h2>Add an evacuation center</h2>
        <form @submit.prevent="submit">
          <label>
            Name *
            <input v-model="form.name" required maxlength="120" />
          </label>

          <label>
            Address
            <input v-model="form.address" maxlength="300" />
          </label>

          <div class="form-row">
            <label>
              Latitude
              <input v-model.number="form.latitude" type="number" min="-90" max="90" step="any" />
            </label>
            <label>
              Longitude
              <input v-model.number="form.longitude" type="number" min="-180" max="180" step="any" />
            </label>
          </div>

          <label>
            Capacity
            <input v-model.number="form.capacity" type="number" min="0" max="100000" step="1" />
          </label>

          <div class="form-row">
            <label>
              Contact person
              <input v-model="form.contact_person" maxlength="100" />
            </label>
            <label>
              Contact number
              <input v-model="form.contact_number" maxlength="40" />
            </label>
          </div>

          <label>
            Notes
            <textarea v-model="form.notes" maxlength="1000" rows="4" />
          </label>

          <label class="publish-field center-open-toggle">
            <input v-model="form.is_open" type="checkbox" />
            Open to evacuees
          </label>

          <div class="announcement-submit-actions">
            <button class="button primary-button" type="submit" :disabled="busy">
              {{ busy ? 'Saving...' : 'Create center' }}
            </button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">EVACUATION CENTERS</span>
            <h2>Manage centers</h2>
          </div>
        </div>

        <ErrorNotice v-if="errorMessage" :message="errorMessage" />
        <div v-else-if="pending" class="alert-state">Loading evacuation centers...</div>
        <div v-else-if="centers.length === 0" class="alert-state">No evacuation centers yet.</div>

        <div v-else class="report-list">
          <div v-for="center in centers" :key="center.id" class="report-item">
            <div class="item-between">
              <div>
                <strong>{{ center.name }}</strong>
                <p>{{ center.address || 'No address provided' }}</p>
                <small>Capacity: {{ center.capacity ?? 'Not specified' }}</small>
                <small>Contact: {{ center.contact_person || 'Not provided' }} · {{ center.contact_number || 'No number' }}</small>
              </div>
              <span class="tag" :class="center.is_open ? 'announcement-status' : 'announcement-status draft'">
                {{ center.is_open ? 'Open' : 'Closed' }}
              </span>
            </div>

            <p v-if="center.notes">{{ center.notes }}</p>

            <div class="center-actions">
              <label class="publish-field">
                <input
                  type="checkbox"
                  role="switch"
                  :checked="center.is_open"
                  :disabled="busy"
                  @change="toggleCenter(center, $event)"
                />
                {{ center.is_open ? 'Open to evacuees' : 'Closed to evacuees' }}
              </label>
              <div class="announcement-actions">
                <button class="button secondary" type="button" :disabled="busy" @click="editCenter(center)">Edit</button>
                <button
                  class="button"
                  type="button"
                  :disabled="busy"
                  style="background:#fee2e2;color:#b91c1c"
                  @click="deleteCenter(center)"
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
