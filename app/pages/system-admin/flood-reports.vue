<script setup lang="ts">
import Swal from 'sweetalert2'
import type { FloodReport, FloodReportInput, FloodReportPatch } from '~~/shared/types/api'
definePageMeta({ layout: 'system-admin', middleware: 'admin', allowedRoles: ['admin'] })
const backend = useBackend()
const reports = ref(await backend.getFloodReports())
const form = reactive<FloodReportInput>({ flooded_areas: '', passable_roads: '', impassable_roads: '', families_evacuated: 0, individuals_evacuated: 0, remarks: '' })
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
  const [date, time] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute)).toISOString()
}
const reportedAt = ref(currentPhilippineDateTime())
const errorMessage = ref('')
const submit = async () => {
  try {
    await backend.createFloodReport({ ...form, reported_at: philippineDateTimeToIso(reportedAt.value) })
    reports.value = await backend.getFloodReports()
    Object.assign(form, { flooded_areas: '', passable_roads: '', impassable_roads: '', families_evacuated: 0, individuals_evacuated: 0, remarks: '' })
    reportedAt.value = currentPhilippineDateTime()
    errorMessage.value = ''
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? error?.statusMessage ?? 'Unable to save report.'
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
        <textarea id="flooded-areas" class="swal2-textarea">${escapeHtml(draft.flooded_areas ?? '')}</textarea>
        <label for="passable-roads">Passable roads</label>
        <textarea id="passable-roads" class="swal2-textarea">${escapeHtml(draft.passable_roads ?? '')}</textarea>
        <label for="impassable-roads">Impassable roads</label>
        <textarea id="impassable-roads" class="swal2-textarea">${escapeHtml(draft.impassable_roads ?? '')}</textarea>
        <label for="families-evacuated">Families evacuated</label>
        <input id="families-evacuated" class="swal2-input" type="number" min="0" step="1" value="${escapeHtml(draft.families_evacuated ?? 0)}">
        <label for="individuals-evacuated">Individuals evacuated</label>
        <input id="individuals-evacuated" class="swal2-input" type="number" min="0" step="1" value="${escapeHtml(draft.individuals_evacuated ?? 0)}">
        <label for="remarks">Extra Remarks</label>
        <textarea id="remarks" class="swal2-textarea">${escapeHtml(draft.remarks ?? '')}</textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Apply Changes',
    cancelButtonText: 'Discard Changes',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83',
    focusConfirm: false,
    preConfirm: () => {
      const reportedAt = (document.getElementById('reported-at') as HTMLInputElement).value
      const families = Number((document.getElementById('families-evacuated') as HTMLInputElement).value)
      const individuals = Number((document.getElementById('individuals-evacuated') as HTMLInputElement).value)
      if (!reportedAt) {
        Swal.showValidationMessage('Date and time are required.')
        return false
      }
      if (!Number.isInteger(families) || families < 0 || !Number.isInteger(individuals) || individuals < 0) {
        Swal.showValidationMessage('Evacuation counts must be whole numbers of 0 or more.')
        return false
      }
      return {
        reported_at: philippineDateTimeToIso(reportedAt),
        flooded_areas: (document.getElementById('flooded-areas') as HTMLTextAreaElement).value || null,
        passable_roads: (document.getElementById('passable-roads') as HTMLTextAreaElement).value || null,
        impassable_roads: (document.getElementById('impassable-roads') as HTMLTextAreaElement).value || null,
        families_evacuated: families,
        individuals_evacuated: individuals,
        remarks: (document.getElementById('remarks') as HTMLTextAreaElement).value || null
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

  try {
    await backend.updateFloodReport(report.id, values)
    reports.value = await backend.getFloodReports()
    errorMessage.value = ''
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? error?.statusMessage ?? 'Unable to update report.'
  }
}
</script>
<template><section class="page-content"><ErrorNotice v-if="errorMessage" :message="errorMessage" /><div class="two-column"><article class="panel form-panel"><span class="eyebrow">FIELD REPORT</span><h2>Record current conditions</h2><form @submit.prevent="submit"><label>Date and time (Philippine time)<input v-model="reportedAt" type="datetime-local" required /></label><label>Flooded areas<textarea v-model="form.flooded_areas" /></label><label>Passable roads<textarea v-model="form.passable_roads" /></label><label>Impassable roads<textarea v-model="form.impassable_roads" /></label><div class="form-row"><label>Families evacuated<input v-model.number="form.families_evacuated" type="number" min="0" /></label><label>Individuals evacuated<input v-model.number="form.individuals_evacuated" type="number" min="0" /></label></div><label>Extra Remarks<textarea v-model="form.remarks" /></label><button class="button primary-button">Save report</button></form></article><article class="panel"><div class="panel-heading"><div><span class="eyebrow">REPORT HISTORY</span><h2>Recent reports</h2></div></div><div class="report-list"><div v-for="report in reports.items" :key="report.id" class="report-item"><div class="item-between"><div><strong>{{ formatTime(report.reported_at) }}</strong><p>{{ report.flooded_areas || 'No flooded areas recorded.' }}</p><small>{{ report.families_evacuated }} families · {{ report.individuals_evacuated }} individuals evacuated</small></div><button class="button secondary" type="button" @click="editReport(report)">Edit</button></div></div></div></article></div></section></template>
