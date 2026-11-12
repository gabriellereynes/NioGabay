
<script setup lang="ts">
useHead({
  title: 'Home | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'NioGabay provides flood monitoring updates and public safety information for Barangay Niog, Bacoor City.'
    }
  ]
})

// CURRENT FLOOD STATUS
const {
  status,
  errorMessage: statusError,
  pending: statusPending,
  isOffline,
  hasData,
  lastUpdated
} = useFloodStatus()

const getAlertClass = (level: string) => {
  const classes: Record<string, string> = {
    normal: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    evacuation: 'bg-amber-100 text-amber-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800'
  }

  return classes[level] ?? 'bg-slate-100 text-slate-700'
}

const announcements = [
  {
    id: 1,
    title: 'Flood Monitoring System is Now Active',
    category: 'General',
    date: 'November 10, 2026',
    description: 'Residents can now monitor flood conditions and access safety information through NioGabay.'
  }
]


import type { ECharts } from 'echarts'

const chartElement = ref<HTMLDivElement | null>(null)

let chartInstance: ECharts | null = null

// Get actual readings from the public API
const {
  chartPoints,
  hasPoints,
  pending,
  errorMessage,
  peak
} = useReadings()

// DEBUG: Check the readings received from the API
watch(chartPoints, (points) => {
  console.log('Chart points:', points)
  console.log('Number of readings:', points.length)
}, { immediate: true })

// Update the ECharts line chart
const updateChart = () => {
  if (!chartInstance) return

  chartInstance.setOption({
    series: [
      {
        data: chartPoints.value.map(point => [
          point.x,
          point.y
        ])
      }
    ]
  })
}

// Initialize ECharts when the page loads
onMounted(async () => {
  const echarts = await import('echarts')

  if (!chartElement.value) return

  chartInstance = echarts.init(chartElement.value)

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `${value} cm`
    },

    grid: {
      left: 55,
      right: 25,
      top: 30,
      bottom: 45,
      containLabel: true
    },

    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        hideOverlap: true
      }
    },

    yAxis: {
      type: 'value',
      name: 'Water Level (cm)',
      min: 0,
      axisLabel: {
        formatter: '{value} cm'
      }
    },

    series: [
      {
        name: 'Water Level',
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 8,
        data: chartPoints.value.map(point => [
          point.x,
          point.y
        ]),
        lineStyle: {
          width: 3,
          color: '#2563EB'
        },
        areaStyle: {
          opacity: 0.12
        }
      }
    ]
  })

  window.addEventListener('resize', resizeChart)
})

// Watch for new readings from the API
watch(chartPoints, updateChart, { deep: true })

// Resize the chart when the browser window changes
const resizeChart = () => {
  chartInstance?.resize()
}

// Clean up when leaving the page
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
  chartInstance = null
})

</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-800">

    <!-- WELCOME SECTION -->
    <section class="bg-gradient-to-br from-blue-900 to-blue-700 px-5 py-16 text-white md:px-8 md:py-24">
      <div class="mx-auto max-w-7xl">

        <p class="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-200">
          Barangay Niog • Bacoor City
        </p>

        <h1 class="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          Stay Informed.
          <span class="text-blue-200">Stay Safe.</span>
        </h1>

        <p class="mt-5 max-w-2xl text-base leading-relaxed text-blue-100 md:text-lg">
          Monitor current flood conditions, receive important announcements,
          and access safety information for your community.
        </p>

        <NuxtLink
          to="/subscribe"
          class="mt-8 inline-block rounded-lg bg-amber-400 px-6 py-3 font-semibold text-blue-950 shadow-md transition hover:bg-amber-300"
        >
          Get SMS Alerts
        </NuxtLink>

      </div>
    </section>


<!-- CURRENT FLOOD STATUS -->
<section class="px-5 py-12 md:px-8">
  <div class="mx-auto max-w-7xl">

    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900 md:text-3xl">
        Current Flood Status
      </h2>
      <p class="mt-2 text-sm text-slate-500">
        Latest available water-level information.
      </p>
    </div>

    <!-- LOADING -->
    <div
      v-if="statusPending && !status"
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <p class="text-sm text-slate-500">
        Loading current flood status...
      </p>
    </div>

    <!-- ERROR -->
    <div
      v-else-if="statusError && !status"
      class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
    >
      Unable to load the current flood status: {{ statusError }}
    </div>

    <!-- FLOOD STATUS DATA -->
    <div
      v-else-if="status"
      class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">

        <!-- WATER LEVEL -->
        <div>
          <p class="text-sm font-medium text-slate-500">
            Current Water Level
          </p>

          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-5xl font-bold text-slate-900 md:text-6xl">
              {{ status.water_level_cm ?? '--' }}
            </span>

            <span class="text-xl text-slate-500">
              cm
            </span>
          </div>

          <p class="mt-2 text-sm text-slate-500">
            {{ status.water_level_ft !== null
              ? `${status.water_level_ft} ft`
              : 'No reading available'
            }}
          </p>
        </div>

        <!-- ALERT STATUS -->
        <div>
          <p class="text-sm font-medium text-slate-500">
            Alert Status
          </p>

          <div class="mt-3">
            <span
              class="inline-flex rounded-full px-4 py-2 text-sm font-bold"
              :class="getAlertClass(status.alert_level)"
            >
              {{ status.alert_label }}
            </span>
          </div>
        </div>

      </div>

      <!-- SENSOR INFORMATION -->
      <div
        class="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between"
      >

        <p class="text-slate-500">
          Last updated:
          <span class="font-medium text-slate-700">
            {{ lastUpdated }}
          </span>
        </p>

        <p class="text-slate-500">
          Sensor:
          <span
            class="font-bold"
            :class="isOffline ? 'text-red-700' : 'text-green-700'"
          >
            {{ isOffline ? 'Offline' : 'Online' }}
          </span>
        </p>

      </div>

      <!-- OFFLINE WARNING -->
      <div
        v-if="isOffline && hasData"
        class="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
      >
        No recent sensor data is available. The displayed reading may be outdated.
        Please check the last update time.
      </div>

      <!-- NO READING WARNING -->
      <div
        v-else-if="!hasData"
        class="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
      >
        No water-level readings have been recorded yet.
      </div>

      <!-- REFRESH ERROR WITH EXISTING DATA -->
      <p
        v-if="statusError && status"
        class="mt-4 text-sm text-red-600"
      >
        Unable to refresh the latest status. Showing the previously loaded data.
      </p>

    </div>

  </div>
</section>


    <!-- WATER LEVEL HISTORY -->
    <section class="px-5 pb-12 md:px-8">
      <div class="mx-auto max-w-7xl">

        <h2 class="text-2xl font-bold text-slate-900 md:text-3xl">
          Water Level History
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          Monitor changes in water level over the past 24 hours.
        </p>


<div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

  <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 class="text-lg font-bold text-slate-900">
        Water Level Trend
      </h3>
      <p class="text-sm text-slate-500">
        Actual sensor readings from the past 24 hours.
      </p>
    </div>

    <p v-if="hasPoints" class="text-sm font-semibold text-blue-700">
      Peak: {{ peak }} cm
    </p>
  </div>

  <div class="relative">
    <div
      ref="chartElement"
      class="h-80 w-full"
    ></div>

    <div
      v-if="pending && !hasPoints"
      class="absolute inset-0 flex items-center justify-center bg-white"
    >
      <p class="text-sm text-slate-500">
        Loading water-level readings...
      </p>
    </div>

    <div
      v-else-if="!hasPoints && !errorMessage"
      class="absolute inset-0 flex items-center justify-center bg-white"
    >
      <p class="text-center text-sm text-slate-400">
        No readings available for the past 24 hours.
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>
  </div>

</div>

      </div>
    </section>

    <!-- LATEST ANNOUNCEMENTS -->
    <section class="bg-white px-5 py-12 md:px-8">
      <div class="mx-auto max-w-7xl">

        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

          <div>
            <h2 class="text-2xl font-bold text-slate-900 md:text-3xl">
              Latest Announcements
            </h2>

            <p class="mt-2 text-sm text-slate-500">
              Important updates and advisories from the barangay.
            </p>
          </div>

          <NuxtLink
            to="/announcements"
            class="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
          >
            View All →
          </NuxtLink>

        </div>

        <div class="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

          <article
            v-for="announcement in announcements"
            :key="announcement.id"
            class="rounded-xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-md"
          >

            <span class="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              {{ announcement.category }}
            </span>

            <h3 class="mt-4 text-lg font-bold text-slate-900">
              {{ announcement.title }}
            </h3>

            <p class="mt-2 text-xs text-slate-400">
              {{ announcement.date }}
            </p>

            <p class="mt-4 text-sm leading-relaxed text-slate-600">
              {{ announcement.description }}
            </p>

          </article>

        </div>
      </div>
    </section>

    <!-- QUICK LINKS -->
    <section class="px-5 py-12 md:px-8">
      <div class="mx-auto max-w-7xl">

        <h2 class="text-2xl font-bold text-slate-900 md:text-3xl">
          Safety Information
        </h2>

        <p class="mt-2 text-sm text-slate-500">
          Find important information and resources when you need them.
        </p>

        <div class="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">

          <NuxtLink
            to="/evacuation-centers"
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <h3 class="text-xl font-bold text-slate-900">
              Evacuation Centers
            </h3>

            <p class="mt-3 text-sm leading-relaxed text-slate-600">
              Find evacuation locations, addresses, and available facilities.
            </p>

            <span class="mt-5 inline-block font-semibold text-blue-700">
              View Centers →
            </span>
          </NuxtLink>

          <NuxtLink
            to="/emergency-contacts"
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <h3 class="text-xl font-bold text-slate-900">
              Emergency Contacts
            </h3>

            <p class="mt-3 text-sm leading-relaxed text-slate-600">
              Access important emergency contact numbers when assistance is needed.
            </p>

            <span class="mt-5 inline-block font-semibold text-blue-700">
              View Contacts →
            </span>
          </NuxtLink>

        </div>
      </div>
    </section>

    <!-- SMS SUBSCRIPTION CTA -->
    <section class="px-5 pb-16 md:px-8">
      <div class="mx-auto max-w-7xl rounded-2xl bg-blue-900 px-6 py-10 text-center text-white md:px-12 md:py-14">

        <h2 class="text-2xl font-bold md:text-3xl">
          Stay Updated. Stay Prepared.
        </h2>

        <p class="mx-auto mt-4 flex w-full max-w-xl justify-center text-center text-sm leading-relaxed text-blue-100 md:text-base" style="text-align: center;">
          <span class="block w-full text-center">
            Subscribe to NioGabay SMS alerts to receive important flood-related
            notifications and announcements.
          </span>
        </p>

        <NuxtLink
          to="/subscribe"
          class="mt-7 inline-block rounded-lg bg-amber-400 px-6 py-3 font-semibold text-blue-950 transition hover:bg-amber-300"
        >
          Subscribe Now
        </NuxtLink>

      </div>
    </section>

  </main>
</template>
