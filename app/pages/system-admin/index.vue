<script setup lang="ts">
import Swal from 'sweetalert2'
import type { AlertLevel, ReadingRange } from '~~/shared/types/api'

definePageMeta({ layout: 'system-admin', middleware: 'admin', allowedRoles: ['admin'] })

const {
  status,
  isOffline,
  hasData,
  lastUpdated,
  errorMessage: statusError,
  pending: statusPending,
  refresh: refreshStatus
} = useFloodStatus({ staff: true })
const {
  levels: alertLevels,
  pending: alertLevelsPending,
  busy: alertLevelsBusy,
  errorMessage: alertLevelsError,
  updateLevel
} = useAlertLevels()
const range = ref<ReadingRange>('24h')
const {
  chartPoints,
  hasPoints,
  peak,
  errorMessage: readingsError,
  pending: readingsPending
} = useReadings({ staff: true, range })
const {
  items: alerts,
  total: alertsTotal,
  limit: alertsLimit,
  page: alertsPage,
  totalPages: alertsTotalPages,
  pending: alertsPending,
  errorMessage: alertsError,
  previousPage: previousAlertsPage,
  nextPage: nextAlertsPage,
  acknowledge: acknowledgeAlert
} = useAlerts()
const alertActionError = ref('')
const acknowledgingIds = ref<number[]>([])
const thresholdSaveInProgress = ref(false)
const ranges: ReadingRange[] = ['24h', '7d', '30d', '90d']

const requestErrorMessage = (error: unknown) => {
  const requestError = error as {
    data?: { statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  return requestError.data?.statusMessage
    ?? requestError.statusMessage
    ?? requestError.message
    ?? 'Unable to update the alert threshold.'
}

const editThreshold = async (level: AlertLevel) => {
  if (thresholdSaveInProgress.value || alertLevelsBusy.value) return

  const result = await Swal.fire<number>({
    title: `Edit ${level.label} threshold`,
    html: `
      <label for="alert-level-ft">Threshold (feet)
        <input id="alert-level-ft" class="swal2-input" type="number" min="0.01" max="30" step="0.01" required value="${level.level_ft}">
      </label>
    `,
    showCancelButton: true,
    confirmButtonText: 'Continue',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83',
    focusConfirm: false,
    preConfirm: () => {
      const input = Swal.getPopup()?.querySelector<HTMLInputElement>('#alert-level-ft')
      if (!input || !input.value || !input.checkValidity()) {
        Swal.showValidationMessage('Enter a value above 0 and at most 30 ft, with up to two decimals.')
        return false
      }

      const value = Number(input.value)
      if (!Number.isFinite(value) || value <= 0 || value > 30) {
        Swal.showValidationMessage('Enter a value above 0 and at most 30 ft, with up to two decimals.')
        return false
      }

      return value
    }
  })

  if (!result.isConfirmed || result.value === undefined) return

  const confirmation = await Swal.fire({
    title: 'Confirm threshold change?',
    text: 'New readings will use the new threshold. Past alerts are not changed.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Save threshold',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83'
  })
  if (!confirmation.isConfirmed) return

  thresholdSaveInProgress.value = true
  try {
    await updateLevel(level.id, result.value)
    await refreshStatus()
  } catch (error) {
    await Swal.fire({
      title: 'Threshold not updated',
      text: requestErrorMessage(error),
      icon: 'error',
      confirmButtonColor: '#087f82'
    })
  } finally {
    thresholdSaveInProgress.value = false
  }
}

const acknowledge = async (id: number) => {
  const result = await Swal.fire({
    title: 'Acknowledge alert?',
    text: 'Are you sure you want to acknowledge this alert?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, acknowledge it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83'
  })

  if (!result.isConfirmed) return

  acknowledgingIds.value = [...acknowledgingIds.value, id]
  alertActionError.value = ''
  try {
    await acknowledgeAlert(id)
    await refreshStatus()
  } catch (error: unknown) {
    const requestError = error as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
    alertActionError.value = requestError.data?.statusMessage ?? requestError.statusMessage ?? requestError.message ?? 'Unable to acknowledge alert.'
  } finally {
    acknowledgingIds.value = acknowledgingIds.value.filter(alertId => alertId !== id)
  }
}
const formatTime = (value: string | null) => value ? new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'No reading yet'

</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="statusError" :message="statusError" />
    <div v-if="statusPending && !status" class="panel">Loading live status...</div>
    <template v-if="status">
    <div v-if="isOffline" class="offline-notice"><strong>No recent sensor data.</strong> Last update: {{ lastUpdated }}. The displayed level may be old.</div>
    <div v-if="status.sensor.mount_height_cm === null" class="offline-notice"><strong>Mount height not set.</strong> Readings are not being accepted.</div>
    <div class="metric-grid">
      <article class="metric-card primary">
        <span class="eyebrow">CURRENT WATER LEVEL</span>
        <div class="metric-value"><template v-if="hasData">{{ status.water_level_ft }} <small>ft</small></template><template v-else>No data yet</template></div>
        <div class="metric-meta"><span class="level-pill" :class="`level-${status.alert_level}`">{{ status.alert_label }}</span><span>{{ lastUpdated }}</span><span v-if="hasData">{{ status.water_level_cm }} cm</span><span v-if="status.latest_reading">Raw distance: {{ status.latest_reading.distance_cm }} cm</span></div>
      </article>
      <article class="metric-card"><span class="eyebrow">SENSOR</span><div class="metric-title">{{ status.sensor.name }}</div><p>{{ status.sensor.location_description }}</p><span class="online-label" :class="{ offline: !status.sensor_online }">{{ status.sensor_online ? 'Online' : 'Offline' }}</span></article>
      <article class="metric-card"><span class="eyebrow">UNACKNOWLEDGED ALERTS</span><div class="metric-value">{{ status.unacknowledged_alerts }}</div><p>Review alerts below</p></article>
    </div>
    <div class="content-grid">
      <article class="panel chart-panel">
        <div class="panel-heading">
          <div><span class="eyebrow">WATER LEVEL HISTORY</span><h2>Peak readings over time</h2></div>
          <select v-model="range">
            <option v-for="item in ranges" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
        <div v-if="readingsPending && !hasPoints" class="chart-state">Loading readings...</div>
        <div v-else-if="readingsError && !hasPoints" class="chart-state error-notice">{{ readingsError }}</div>
        <div v-else-if="!hasPoints" class="chart-state">No readings in this period.</div>
        <template v-else>
          <ErrorNotice v-if="readingsError" :message="readingsError" />
          <LevelChart :chart-points="chartPoints" :levels="status.levels" />
          <div v-if="peak !== null" class="chart-summary">Peak: {{ (peak / 30.48).toFixed(2) }} ft ({{ peak.toFixed(1) }} cm)</div>
          <div class="chart-legend"><span>Water level</span><span v-for="level in status.levels" :key="level.id" class="legend-item">
  <span :class="`legend-${level.code}`">{{ level.label }}</span>
  · {{ level.level_ft }} ft
</span></div>
        </template>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <div><span class="eyebrow">ALERT LEVELS</span><h2>Threshold guide</h2></div>
        </div>
        <ErrorNotice v-if="alertLevelsError" :message="alertLevelsError" />
        <div v-else-if="alertLevelsPending && !alertLevels.length" class="alert-state">Loading alert levels...</div>
        <div v-else-if="!alertLevels.length" class="alert-state">No alert levels available.</div>
        <div v-else class="level-list">
          <div v-for="level in alertLevels" :key="level.id" class="level-row">
            <span class="level-dot" :class="`level-${level.code}`"></span>
            <div>
              <strong>{{ level.label }}</strong>
              <small>{{ level.description }}</small>
            </div>
            <b>{{ level.level_ft }} ft</b>
            <button
              class="button secondary"
              type="button"
              :disabled="alertLevelsBusy || thresholdSaveInProgress"
              :aria-label="`Edit ${level.label} threshold`"
              @click="editThreshold(level)"
            >
              Edit
            </button>
          </div>
        </div>
      </article>
    </div>
    </template>
    <article class="panel">
      <div class="panel-heading">
        <div><span class="eyebrow">RECENT ALERTS</span><h2>Review and acknowledge</h2></div>
        <NuxtLink to="/system-admin/flood-reports" class="text-link">View reports →</NuxtLink>
      </div>
      <ErrorNotice v-if="alertActionError" :message="alertActionError" />
      <ErrorNotice v-if="alertsError" :message="alertsError" />
      <div v-if="alertsPending && !alerts.length" class="alert-state">Loading alerts...</div>
      <div v-else-if="alertsError && !alerts.length" class="alert-state">Alerts could not be loaded.</div>
      <div v-else-if="!alerts.length" class="alert-state">No alerts yet.</div>
      <template v-else>
        <div class="alert-list">
          <div v-for="alert in alerts" :key="alert.id" class="alert-row">
            <span class="level-pill" :class="`level-${alert.alert_level ?? 'normal'}`">{{ alert.alert_label ?? 'General notice' }}</span>
            <div class="alert-copy">
              <small class="tag">{{ alert.source === 'sensor' ? 'Sensor' : 'Manual' }}</small>
              <p>{{ alert.message }}</p>
              <small>Triggered {{ formatTime(alert.triggered_at) }}<template v-if="alert.created_by_name"> · Sent by {{ alert.created_by_name }}</template></small>
              <small v-if="alert.acknowledged_at">Acknowledged by {{ alert.acknowledged_by_name ?? 'Unknown user' }} · {{ formatTime(alert.acknowledged_at) }}</small>
              <small v-else>Not acknowledged yet</small>
            </div>
            <button v-if="!alert.acknowledged_at" class="button secondary" :disabled="acknowledgingIds.includes(alert.id)" @click="acknowledge(alert.id)">
              {{ acknowledgingIds.includes(alert.id) ? 'Acknowledging...' : 'Acknowledge' }}
            </button>
            <span v-else class="acknowledged">Acknowledged</span>
          </div>
        </div>
        <div class="alert-pagination">
          <label>Per page
            <select v-model.number="alertsLimit">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </label>
          <span>Page {{ alertsPage }} of {{ alertsTotalPages }} · {{ alertsTotal }} alerts</span>
          <div>
            <button class="button secondary" :disabled="alertsPage <= 1" @click="previousAlertsPage">Previous</button>
            <button class="button secondary" :disabled="alertsPage >= alertsTotalPages" @click="nextAlertsPage">Next</button>
          </div>
        </div>
      </template>
    </article>
  </section>
</template>
