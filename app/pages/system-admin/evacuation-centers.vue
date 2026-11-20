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
const editingCenter = ref<EvacuationCenter | null>(null)
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

const validateForm = (): string | null => {
  const name = form.name.trim()
  if (name.length < 1 || name.length > 120) return 'name must be 1 to 120 characters'
  if (form.address.length > 300) return 'address must be 300 characters or fewer'
  if (form.contact_person.length > 100) return 'contact_person must be 100 characters or fewer'
  if (form.contact_number.length > 40) return 'contact_number must be 40 characters or fewer'
  if (form.notes.length > 1000) return 'notes must be 1000 characters or fewer'

  if (form.latitude !== '' && form.latitude !== null
    && (!Number.isFinite(form.latitude) || form.latitude < -90 || form.latitude > 90)) {
    return 'latitude must be between -90 and 90'
  }
  if (form.longitude !== '' && form.longitude !== null
    && (!Number.isFinite(form.longitude) || form.longitude < -180 || form.longitude > 180)) {
    return 'longitude must be between -180 and 180'
  }
  if (form.capacity !== '' && form.capacity !== null
    && (!Number.isInteger(form.capacity) || form.capacity < 0 || form.capacity > 100_000)) {
    return 'capacity must be a whole number between 0 and 100000'
  }

  return null
}

const getPayload = (): EvacuationCenterInput => ({
  name: form.name.trim(),
  address: optionalText(form.address),
  latitude: optionalNumber(form.latitude),
  longitude: optionalNumber(form.longitude),
  capacity: optionalNumber(form.capacity),
  contact_person: optionalText(form.contact_person),
  contact_number: optionalText(form.contact_number),
  is_open: form.is_open,
  notes: optionalText(form.notes)
})

const resetForm = () => {
  Object.assign(form, emptyForm())
  editingCenter.value = null
}

const submit = async () => {
  mutationError.value = validateForm() ?? ''
  if (mutationError.value) return

  try {
    const payload = getPayload()
    if (editingCenter.value) {
      await update(editingCenter.value.id, payload)
    } else {
      await create(payload)
    }
    resetForm()
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to save the evacuation center.')
  }
}

const editCenter = (center: EvacuationCenter) => {
  mutationError.value = ''
  editingCenter.value = center
  Object.assign(form, {
    name: center.name,
    address: center.address ?? '',
    latitude: center.latitude,
    longitude: center.longitude,
    capacity: center.capacity,
    contact_person: center.contact_person ?? '',
    contact_number: center.contact_number ?? '',
    is_open: center.is_open,
    notes: center.notes ?? ''
  })
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
    if (editingCenter.value?.id === center.id) resetForm()
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
        <span class="eyebrow">{{ editingCenter ? 'EDIT CENTER' : 'NEW CENTER' }}</span>
        <h2>{{ editingCenter ? 'Update evacuation center' : 'Add an evacuation center' }}</h2>
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
              {{ busy ? 'Saving...' : (editingCenter ? 'Save changes' : 'Create center') }}
            </button>
            <button
              v-if="editingCenter"
              class="button secondary"
              type="button"
              :disabled="busy"
              @click="resetForm"
            >
              Cancel
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
