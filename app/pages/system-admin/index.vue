<script setup lang="ts">
import Swal from 'sweetalert2'
import type { ReadingRange } from '~~/shared/types/api'

definePageMeta({ layout: 'system-admin', middleware: 'admin', allowedRoles: ['admin'] })

const backend = useBackend()
const status = ref(await backend.getStatus())
const range = ref<ReadingRange>('24h')
const readings = ref(await backend.getReadings(range.value))
const alerts = ref(await backend.getAlerts())
const errorMessage = ref('')
const ranges: ReadingRange[] = ['24h', '7d', '30d', '90d']

const refreshStatus = async () => {
  try { status.value = await backend.getStatus(); alerts.value = await backend.getAlerts(); errorMessage.value = '' }
  catch (error: any) { errorMessage.value = error?.data?.statusMessage ?? error?.statusMessage ?? 'Unable to load dashboard data.' }
}
const changeRange = async () => { readings.value = await backend.getReadings(range.value) }
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
onMounted(() => { timer = setInterval(refreshStatus, 10_000) })
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="errorMessage" :message="errorMessage" />
    <div v-if="!status.sensor_online" class="offline-notice"><strong>No recent sensor data.</strong> Last update: {{ formatTime(status.last_reading_at) }}. The displayed level may be old.</div>
    <div class="metric-grid">
      <article class="metric-card primary">
        <span class="eyebrow">CURRENT WATER LEVEL</span>
        <div class="metric-value">{{ status.water_level_ft ?? '—' }} <small>ft</small></div>
        <div class="metric-meta"><span class="level-pill" :class="`level-${status.alert_level}`">{{ status.alert_label }}</span><span>{{ formatTime(status.last_reading_at) }}</span></div>
      </article>
      <article class="metric-card"><span class="eyebrow">SENSOR</span><div class="metric-title">{{ status.sensor.name }}</div><p>{{ status.sensor.location_description }}</p><span class="online-label" :class="{ offline: !status.sensor_online }">{{ status.sensor_online ? 'Online' : 'Offline' }}</span></article>
      <article class="metric-card"><span class="eyebrow">UNACKNOWLEDGED ALERTS</span><div class="metric-value">{{ status.unacknowledged_alerts }}</div><p>Review alerts below</p></article>
    </div>
    <div class="content-grid">
      <article class="panel chart-panel"><div class="panel-heading"><div><span class="eyebrow">WATER LEVEL HISTORY</span><h2>Peak readings over time</h2></div><select v-model="range" @change="changeRange"><option v-for="item in ranges" :key="item">{{ item }}</option></select></div><LevelChart :readings="readings" :levels="status.levels" /><div class="chart-legend"><span>Water level</span><span v-for="level in status.levels" :key="level.id">{{ level.label }} · {{ level.level_ft }} ft</span></div></article>
      <article class="panel"><div class="panel-heading"><div><span class="eyebrow">ALERT LEVELS</span><h2>Threshold guide</h2></div></div><div class="level-list"><div v-for="level in status.levels" :key="level.id" class="level-row"><span class="level-dot" :class="`level-${level.code}`"></span><div><strong>{{ level.label }}</strong><small>{{ level.description }}</small></div><b>{{ level.level_ft }} ft</b></div></div></article>
    </div>
    <article class="panel"><div class="panel-heading"><div><span class="eyebrow">RECENT ALERTS</span><h2>Review and acknowledge</h2></div><NuxtLink to="/system-admin/flood-reports" class="text-link">View reports →</NuxtLink></div><div class="alert-list"><div v-for="alert in alerts.items" :key="alert.id" class="alert-row"><span class="level-dot" :class="`level-${alert.alert_level ?? 'normal'}`"></span><div class="alert-copy"><strong>{{ alert.alert_label ?? 'Notice' }}</strong><p>{{ alert.message }}</p><small>{{ formatTime(alert.triggered_at) }}</small></div><button v-if="!alert.acknowledged_at" class="button secondary" @click="acknowledge(alert.id)">Acknowledge</button><span v-else class="acknowledged">Acknowledged</span></div></div></article>
  </section>
</template>
