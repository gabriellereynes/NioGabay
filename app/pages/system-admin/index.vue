<script setup lang="ts">
import Swal from 'sweetalert2'
import type { ReadingRange } from '~~/shared/types/api'

definePageMeta({ layout: 'system-admin', middleware: 'admin', allowedRoles: ['admin'] })

const backend = useBackend()
const { status, isOffline, hasData, lastUpdated, errorMessage: statusError, pending: statusPending } = useFloodStatus({ staff: true })
const range = ref<ReadingRange>('24h')
const {
  chartPoints,
  hasPoints,
  peak,
  errorMessage: readingsError,
  pending: readingsPending
} = useReadings({ staff: true, range })
const alerts = ref(await backend.getAlerts())
const errorMessage = ref('')
const ranges: ReadingRange[] = ['24h', '7d', '30d', '90d']

const refreshAlerts = async () => {
  try { alerts.value = await backend.getAlerts(); errorMessage.value = '' }
  catch (error: any) { errorMessage.value = error?.data?.statusMessage ?? error?.statusMessage ?? 'Unable to load dashboard data.' }
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

  try {
    await backend.acknowledgeAlert(id)
    alerts.value = await backend.getAlerts()
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? error?.statusMessage ?? 'Unable to acknowledge alert.'
  }
}
const formatTime = (value: string | null) => value ? new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'No reading yet'

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(refreshAlerts, 10_000) })
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="errorMessage" :message="errorMessage" />
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
      <article class="panel"><div class="panel-heading"><div><span class="eyebrow">ALERT LEVELS</span><h2>Threshold guide</h2></div></div><div class="level-list"><div v-for="level in status.levels" :key="level.id" class="level-row"><span class="level-dot" :class="`level-${level.code}`"></span><div><strong>{{ level.label }}</strong><small>{{ level.description }}</small></div><b>{{ level.level_ft }} ft</b></div></div></article>
    </div>
    </template>
    <article class="panel"><div class="panel-heading"><div><span class="eyebrow">RECENT ALERTS</span><h2>Review and acknowledge</h2></div><NuxtLink to="/system-admin/flood-reports" class="text-link">View reports →</NuxtLink></div><div class="alert-list"><div v-for="alert in alerts.items" :key="alert.id" class="alert-row"><span class="level-dot" :class="`level-${alert.alert_level ?? 'normal'}`"></span><div class="alert-copy"><strong>{{ alert.alert_label ?? 'Notice' }}</strong><p>{{ alert.message }}</p><small>{{ formatTime(alert.triggered_at) }}</small></div><button v-if="!alert.acknowledged_at" class="button secondary" @click="acknowledge(alert.id)">Acknowledge</button><span v-else class="acknowledged">Acknowledged</span></div></div></article>
  </section>
</template>
