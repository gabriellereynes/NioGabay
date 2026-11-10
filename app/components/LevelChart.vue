<script setup lang="ts">
import type { AlertLevel, ReadingsResponse } from '~~/shared/types/api'

const props = defineProps<{ readings: ReadingsResponse; levels: AlertLevel[] }>()
const max = computed(() => Math.max(...props.levels.map(level => level.level_cm), ...props.readings.points.map(point => point.water_level_cm), 1))
const barPoints = computed(() => props.readings.points.filter((_, index) => index % Math.max(1, Math.ceil(props.readings.points.length / 48)) === 0))
const height = (value: number) => `${Math.max(3, (value / max.value) * 100)}%`
const thresholdPosition = (value: number) => `${100 - (value / max.value) * 100}%`
</script>

<template>
  <div class="chart-wrap">
    <div v-for="level in levels" :key="level.id" class="threshold" :style="{ top: thresholdPosition(level.level_cm) }">
      <span>{{ level.level_ft }} ft</span>
    </div>
    <div class="bars">
      <div v-for="(point, index) in barPoints" :key="`${point.t}-${index}`" class="bar" :style="{ height: height(point.water_level_cm) }" :title="`${(point.water_level_cm / 30.48).toFixed(2)} ft · ${new Date(point.t).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`"></div>
    </div>
  </div>
</template>
