<script setup lang="ts">
import type { AlertLevel } from '~~/shared/types/api'

import type { ECharts } from 'echarts'

const props = defineProps<{
  chartPoints: { x: number; y: number }[]
  levels: AlertLevel[]
}>()

const chartElement = ref<HTMLDivElement | null>(null)
let chartInstance: ECharts | null = null

const maxWaterLevel = computed(() => Math.max(
  ...props.levels.map(level => level.level_cm),
  ...props.chartPoints.map(point => point.y),
  1
))

const formatManila = (timestamp: number) => new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila'
}).format(new Date(timestamp))

const getThresholdLines = () => props.levels.map(level => ({
  yAxis: level.level_cm,
  name: level.code
}))

const updateChart = () => {
  if (!chartInstance) return

  chartInstance.setOption({
    yAxis: { max: maxWaterLevel.value },
    series: [{
      data: props.chartPoints.map(point => [point.x, point.y]),
      markLine: { data: getThresholdLines() }
    }]
  })
}

const resizeChart = () => chartInstance?.resize()

onMounted(async () => {
  const echarts = await import('echarts')
  if (!chartElement.value) return

  chartInstance = echarts.init(chartElement.value)
  chartInstance.setOption({
    animation: false,
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `${value.toFixed(1)} cm (${(value / 30.48).toFixed(2)} ft)`
    },
    grid: {
      left: 58,
      right: 24,
      top: 28,
      bottom: 42,
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        hideOverlap: true,
        formatter: (value: number) => formatManila(value)
      }
    },
    yAxis: {
      type: 'value',
      name: 'Water Level (ft)',
      min: 0,
      max: maxWaterLevel.value,
      axisLabel: {
        formatter: (value: number) => `${(value / 30.48).toFixed(1)} ft`
      }
    },
    series: [{
      name: 'Water Level',
      type: 'line',
      smooth: false,
      showSymbol: true,
      symbolSize: 7,
      data: props.chartPoints.map(point => [point.x, point.y]),
      lineStyle: {
        width: 3,
        color: '#2563EB'
      },
      areaStyle: {
        opacity: 0.12
      },
      markLine: {
        silent: false,
        symbol: 'none',
        tooltip: {
          show: true,
          trigger: 'item',
          formatter: (params: { name?: string }) => {
            const level = props.levels.find(item => item.code === params.name)
            return level ? `${level.label} · ${level.level_ft} ft` : ''
          }
        },
        label: {
          formatter: (params: { name?: string }) => {
            switch (params.name) {
              case 'yellow': return '{yellow|●}'
              case 'evacuation': return '{evacuation|●}'
              case 'orange': return '{orange|●}'
              case 'red': return '{red|●}'
              default: return ''
            }
          },
          rich: {
            yellow: { color: '#f59e0b', fontSize: 14, fontWeight: 'bold' },
            evacuation: { color: '#f97316', fontSize: 14, fontWeight: 'bold' },
            orange: { color: '#ea580c', fontSize: 14, fontWeight: 'bold' },
            red: { color: '#dc2626', fontSize: 14, fontWeight: 'bold' }
          }
        },
        lineStyle: {
          type: 'dashed',
          color: '#94A3B8'
        },
        data: getThresholdLines()
      }
    }]
  })

  window.addEventListener('resize', resizeChart)
})

watch(
  () => [props.chartPoints, props.levels],
  updateChart,
  { deep: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div ref="chartElement" class="chart-wrap"></div>
</template>
