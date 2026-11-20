<script setup lang="ts">
import Swal from 'sweetalert2'
import type { FloodReport, FloodReportInput, FloodReportPatch } from '~~/shared/types/api'

definePageMeta({ layout: 'staff', middleware: 'staff', allowedRoles: ['staff', 'admin'] })

// Real data now: list, create and edit come from app/composables/useFloodReports.ts
const {
  items, total, limit, offset, page, totalPages,
  pending, busy, errorMessage: listError, statusCode,
  previousPage, nextPage, create, update
} = useFloodReports()

const blankForm = (): FloodReportInput => ({
  flooded_areas: '',
  passable_roads: '',
  impassable_roads: '',
  families_evacuated: 0,
  individuals_evacuated: 0,
  remarks: ''
})
const form = reactive<FloodReportInput>(blankForm())

const currentPhilippineDateTime = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date()).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value
    return result
  }, {})
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}
const philippineDateTimeToIso = (value: string) => {
  const [date = '', time = ''] = value.split('T')
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute)).toISOString()
}
const reportedAt = ref(currentPhilippineDateTime())
const errorMessage = ref('')

const requestErrorMessage = (error: unknown, fallback: string) => {
  const typedError = error as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
  return typedError.data?.statusMessage ?? typedError.statusMessage ?? typedError.message ?? fallback
}

const isCount = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0

const submit = async () => {
  errorMessage.value = ''
  // v-model.number gives '' when the box is empty, and the server only accepts real numbers.
  if (!isCount(form.families_evacuated) || !isCount(form.individuals_evacuated)) {
    errorMessage.value = 'Families and individuals evacuated must be whole numbers of 0 or more.'
    return
  }
  try {
    await create({ ...form, reported_at: philippineDateTimeToIso(reportedAt.value) })
    Object.assign(form, blankForm())
    reportedAt.value = currentPhilippineDateTime()
  } catch (error) {
    errorMessage.value = requestErrorMessage(error, 'Unable to save report.')
  }
}

const formatTime = (value: string) => new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
const toDateTimeInput = (value?: string) => {
  if (!value) return currentPhilippineDateTime()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(value)).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value
    return result
  }, {})
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

/** Trim, and treat an empty box as "nothing" so it compares the same as null. */
const clean = (value: string | null | undefined) => (value ?? '').trim() || null

const editReport = async (report: FloodReport, draft: FloodReportPatch = {
  reported_at: report.reported_at ?? new Date().toISOString(),
  flooded_areas: report.flooded_areas,
  passable_roads: report.passable_roads,
  impassable_roads: report.impassable_roads,
  families_evacuated: report.families_evacuated,
  individuals_evacuated: report.individuals_evacuated,
  remarks: report.remarks
}) => {
  const result = await Swal.fire({
    title: 'Edit flood report',
    html: `
      <div class="swal-form">
        <label for="reported-at">Date and time</label>
        <input id="reported-at" class="swal2-input" type="datetime-local" value="${toDateTimeInput(draft.reported_at)}">
        <label for="flooded-areas">Flooded areas</label>
        <textarea id="flooded-areas" class="swal2-textarea" maxlength="2000">${escapeHtml(draft.flooded_areas ?? '')}</textarea>
        <label for="passable-roads">Passable roads</label>
        <textarea id="passable-roads" class="swal2-textarea" maxlength="2000">${escapeHtml(draft.passable_roads ?? '')}</textarea>
        <label for="impassable-roads">Impassable roads</label>
        <textarea id="impassable-roads" class="swal2-textarea" maxlength="2000">${escapeHtml(draft.impassable_roads ?? '')}</textarea>
        <label for="families-evacuated">Families evacuated</label>
        <input id="families-evacuated" class="swal2-input" type="number" min="0" step="1" value="${escapeHtml(draft.families_evacuated ?? 0)}">
        <label for="individuals-evacuated">Individuals evacuated</label>
        <input id="individuals-evacuated" class="swal2-input" type="number" min="0" step="1" value="${escapeHtml(draft.individuals_evacuated ?? 0)}">
        <label for="remarks">Extra Remarks</label>
        <textarea id="remarks" class="swal2-textarea" maxlength="2000">${escapeHtml(draft.remarks ?? '')}</textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Apply Changes',
    cancelButtonText: 'Discard Changes',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83',
    focusConfirm: false,
    preConfirm: () => {
      const reportedAtValue = (document.getElementById('reported-at') as HTMLInputElement).value
      const families = Number((document.getElementById('families-evacuated') as HTMLInputElement).value)
      const individuals = Number((document.getElementById('individuals-evacuated') as HTMLInputElement).value)
      if (!reportedAtValue) {
        Swal.showValidationMessage('Date and time are required.')
        return false
      }
      if (!isCount(families) || !isCount(individuals)) {
        Swal.showValidationMessage('Evacuation counts must be whole numbers of 0 or more.')
        return false
      }
      return {
        reported_at: philippineDateTimeToIso(reportedAtValue),
        flooded_areas: clean((document.getElementById('flooded-areas') as HTMLTextAreaElement).value),
        passable_roads: clean((document.getElementById('passable-roads') as HTMLTextAreaElement).value),
        impassable_roads: clean((document.getElementById('impassable-roads') as HTMLTextAreaElement).value),
        families_evacuated: families,
        individuals_evacuated: individuals,
        remarks: clean((document.getElementById('remarks') as HTMLTextAreaElement).value)
      } satisfies FloodReportPatch
    }
  })

  if (!result.isConfirmed || !result.value) return

  const values = result.value as FloodReportPatch
  const confirmation = await Swal.fire({
    title: 'Confirm report changes',
    html: `
      <div class="swal-summary">
        <p><strong>Date and time:</strong> ${escapeHtml(values.reported_at ? formatTime(values.reported_at) : '')}</p>
        <p><strong>Flooded areas:</strong> ${escapeHtml(values.flooded_areas)}</p>
        <p><strong>Passable roads:</strong> ${escapeHtml(values.passable_roads)}</p>
        <p><strong>Impassable roads:</strong> ${escapeHtml(values.impassable_roads)}</p>
        <p><strong>Families evacuated:</strong> ${values.families_evacuated}</p>
        <p><strong>Individuals evacuated:</strong> ${values.individuals_evacuated}</p>
        <p><strong>Extra Remarks:</strong> ${escapeHtml(values.remarks)}</p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Go back',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83'
  })

  if (!confirmation.isConfirmed) return editReport(report, values)

  // Send only what changed. null clears a text field.
  const patch: FloodReportPatch = {}
  if (values.reported_at && toDateTimeInput(values.reported_at) !== toDateTimeInput(report.reported_at)) {
    patch.reported_at = values.reported_at
  }
  if (values.flooded_areas !== clean(report.flooded_areas)) patch.flooded_areas = values.flooded_areas
  if (values.passable_roads !== clean(report.passable_roads)) patch.passable_roads = values.passable_roads
  if (values.impassable_roads !== clean(report.impassable_roads)) patch.impassable_roads = values.impassable_roads
  if (values.families_evacuated !== report.families_evacuated) patch.families_evacuated = values.families_evacuated
  if (values.individuals_evacuated !== report.individuals_evacuated) patch.individuals_evacuated = values.individuals_evacuated
  if (values.remarks !== clean(report.remarks)) patch.remarks = values.remarks
  if (Object.keys(patch).length === 0) return

  errorMessage.value = ''
  try {
    await update(report.id, patch)
  } catch (error) {
    errorMessage.value = requestErrorMessage(error, 'Unable to update report.')
  }
}
</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="errorMessage" :message="errorMessage" />
    <ErrorNotice v-else-if="statusCode === 403" message="You don't have access to flood reports." />

    <div class="two-column">
      <article class="panel form-panel">
        <span class="eyebrow">FIELD REPORT</span>
        <h2>Record current conditions</h2>
        <form @submit.prevent="submit">
          <label>
            Date and time (Philippine time)
            <input v-model="reportedAt" type="datetime-local" required />
          </label>
          <label>
            Flooded areas
            <textarea v-model="form.flooded_areas" maxlength="2000" />
          </label>
          <label>
            Passable roads
            <textarea v-model="form.passable_roads" maxlength="2000" />
          </label>
          <label>
            Impassable roads
            <textarea v-model="form.impassable_roads" maxlength="2000" />
          </label>
          <div class="form-row">
            <label>
              Families evacuated
              <input v-model.number="form.families_evacuated" type="number" min="0" step="1" required />
            </label>
            <label>
              Individuals evacuated
              <input v-model.number="form.individuals_evacuated" type="number" min="0" step="1" required />
            </label>
          </div>
          <label>
            Extra Remarks
            <textarea v-model="form.remarks" maxlength="2000" />
          </label>
          <button class="button primary-button" type="submit" :disabled="busy">
            {{ busy ? 'Saving...' : 'Save report' }}
          </button>
        </form>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">REPORT HISTORY</span>
            <h2>Recent reports</h2>
          </div>
        </div>

        <ErrorNotice v-if="listError" :message="listError" />
        <div v-else-if="pending && items.length === 0" class="alert-state">Loading reports...</div>
        <div v-else-if="items.length === 0" class="alert-state">No flood reports yet</div>

        <div v-else class="report-list">
          <div v-for="report in items" :key="report.id" class="report-item">
            <div class="item-between">
              <div>
                <strong>{{ formatTime(report.reported_at) }}</strong>
                <p><strong>Flooded areas:</strong> {{ report.flooded_areas || 'None recorded.' }}</p>
                <p><strong>Passable roads:</strong> {{ report.passable_roads || 'None recorded.' }}</p>
                <p><strong>Impassable roads:</strong> {{ report.impassable_roads || 'None recorded.' }}</p>
                <small>{{ report.families_evacuated }} families · {{ report.individuals_evacuated }} individuals evacuated</small>
                <small>Recorded by {{ report.created_by_name || 'Unknown' }}</small>
              </div>
              <button class="button secondary" type="button" :disabled="busy" @click="editReport(report)">Edit</button>
            </div>
          </div>
        </div>

        <div v-if="items.length > 0" class="alert-pagination">
          <span>{{ total }} total · Page {{ page }} of {{ totalPages }}</span>
          <div>
            <button class="button secondary" type="button" :disabled="offset === 0 || pending" @click="previousPage">Previous</button>
            <button class="button secondary" type="button" :disabled="offset + limit >= total || pending" @click="nextPage">Next</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>