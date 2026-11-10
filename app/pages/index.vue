
<script setup>
useHead({
  title: 'Home | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'NioGabay provides flood monitoring updates and public safety information for Barangay Niog, Bacoor City.'
    }
  ]
})

// TEMPORARY SAMPLE DATA
// Replace with API data when the backend is ready.

const floodStatus = {
  waterLevel: 2.5,
  unit: 'ft',
  alertLevel: 'Normal',
  alertLabel: 'Normal Water Level',
  lastUpdated: 'November 10, 2026, 8:00 AM',
  sensorOnline: true
}

const announcements = [
  {
    id: 1,
    title: 'Flood Monitoring System is Now Active',
    category: 'General',
    date: 'November 10, 2026',
    description: 'Residents can now monitor flood conditions and access safety information through NioGabay.'
  },
  {
    id: 2,
    title: 'Stay Alert During Heavy Rainfall',
    category: 'Advisory',
    date: 'November 9, 2026',
    description: 'Residents are advised to remain alert and monitor flood conditions in their area.'
  },
  {
    id: 3,
    title: 'Know Your Nearest Evacuation Center',
    category: 'Evacuation',
    date: 'November 8, 2026',
    description: 'Familiarize yourself with the nearest evacuation center in your community.'
  }
]
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
          class="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-900 shadow-md transition hover:bg-blue-100"
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

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">

            <!-- WATER LEVEL -->
            <div>
              <p class="text-sm font-medium text-slate-500">
                Current Water Level
              </p>

              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-5xl font-bold text-slate-900 md:text-6xl">
                  {{ floodStatus.waterLevel }}
                </span>

                <span class="text-xl text-slate-500">
                  {{ floodStatus.unit }}
                </span>
              </div>
            </div>

            <!-- ALERT STATUS -->
            <div>
              <p class="text-sm font-medium text-slate-500">
                Alert Status
              </p>

              <div class="mt-3">
                <span
                  class="inline-flex rounded-full px-4 py-2 text-sm font-bold"
                  :class="floodStatus.alertLevel === 'Normal'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'"
                >
                  {{ floodStatus.alertLabel }}
                </span>
              </div>
            </div>

          </div>

          <!-- SENSOR INFORMATION -->
          <div class="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">

            <p class="text-slate-500">
              Last updated:
              <span class="font-medium text-slate-700">
                {{ floodStatus.lastUpdated }}
              </span>
            </p>

            <p class="text-slate-500">
              Sensor:
              <span
                :class="floodStatus.sensorOnline ? 'text-green-700' : 'text-red-700'"
                class="font-bold"
              >
                {{ floodStatus.sensorOnline ? 'Online' : 'Offline' }}
              </span>
            </p>

          </div>

          <!-- OFFLINE WARNING -->
          <div
            v-if="!floodStatus.sensorOnline"
            class="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            No recent sensor data is available. The displayed reading may be outdated.
            Please check the last update time.
          </div>

          <p class="mt-5 text-xs text-slate-400">
            Demo data only — not a live flood reading.
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

        <div class="mt-6 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <p class="text-center text-slate-400">
            The 24-hour water-level chart will appear here.
          </p>

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

        <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-100 md:text-base">
          Subscribe to NioGabay SMS alerts to receive important flood-related
          notifications and announcements.
        </p>

        <NuxtLink
          to="/subscribe"
          class="mt-7 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-900 transition hover:bg-blue-100"
        >
          Subscribe Now
        </NuxtLink>

      </div>
    </section>

  </main>
</template>
