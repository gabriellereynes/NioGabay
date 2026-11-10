
<script setup>
import { ref, computed } from 'vue'

useHead({
  title: 'Announcements | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'View the latest flood advisories, evacuation notices, and public announcements from Barangay Niog.'
    }
  ]
})

// TEMPORARY MOCK DATA
// Will be replaced with GET /api/public/announcements?limit=10

const announcements = [
  {
    id: 1,
    title: 'Flood Monitoring System is Now Active',
    category: 'General',
    date: 'November 10, 2026',
    description: 'Residents can now access NioGabay to monitor flood conditions and view important community safety information.'
  }
]

const categories = [
  'All',
  'Flood',
  'Evacuation',
  'Advisory',
  'General'
]

const selectedCategory = ref('All')

const filteredAnnouncements = computed(() => {
  if (selectedCategory.value === 'All') {
    return announcements
  }

  return announcements.filter(
    announcement => announcement.category === selectedCategory.value
  )
})

function categoryStyle(category) {
  const styles = {
    Flood: 'bg-red-100 text-red-800',
    Evacuation: 'bg-amber-100 text-amber-800',
    Advisory: 'bg-blue-100 text-blue-800',
    General: 'bg-slate-100 text-slate-700'
  }

  return styles[category] || 'bg-slate-100 text-slate-700'
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-800">

    <!-- PAGE HEADER -->
    <section class="bg-gradient-to-br from-blue-900 to-blue-700 px-5 py-14 text-white md:px-8 md:py-20">
      <div class="mx-auto max-w-7xl">

        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">
          Barangay Niog • Bacoor City
        </p>

        <h1 class="text-3xl font-bold md:text-5xl">
          Announcements
        </h1>

        <p class="mt-4 max-w-2xl leading-relaxed text-blue-100">
          Stay updated with the latest flood advisories, evacuation notices,
          and important announcements from your barangay.
        </p>

      </div>
    </section>

    <!-- ANNOUNCEMENTS CONTENT -->
    <section class="px-5 py-12 md:px-8">
      <div class="mx-auto max-w-7xl">

        <!-- SECTION TITLE -->
        <div class="mb-7">
          <h2 class="text-2xl font-bold text-slate-900">
            Published Announcements
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            Browse recent updates and information for residents.
          </p>
        </div>

        <!-- CATEGORY FILTERS -->
        <div class="mb-8 flex flex-wrap gap-3">

          <button
            v-for="category in categories"
            :key="category"
            type="button"
            @click="selectedCategory = category"
            class="rounded-full border px-5 py-2 text-sm font-semibold transition"
            :class="selectedCategory === category
              ? 'border-blue-700 bg-blue-700 text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-700'"
          >
            {{ category }}
          </button>

        </div>

        <!-- ANNOUNCEMENT LIST -->
        <div
          v-if="filteredAnnouncements.length > 0"
          class="grid grid-cols-1 gap-5 md:grid-cols-2"
        >

          <article
            v-for="announcement in filteredAnnouncements"
            :key="announcement.id"
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md md:p-7"
          >

            <div class="flex flex-wrap items-center justify-between gap-3">

              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="categoryStyle(announcement.category)"
              >
                {{ announcement.category }}
              </span>

              <span class="text-xs text-slate-400">
                {{ announcement.date }}
              </span>

            </div>

            <h3 class="mt-5 text-xl font-bold leading-snug text-slate-900">
              {{ announcement.title }}
            </h3>

            <p class="mt-3 text-sm leading-relaxed text-slate-600">
              {{ announcement.description }}
            </p>

          </article>

        </div>

        <!-- EMPTY STATE -->
        <div
          v-else
          class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"
        >
          <h3 class="text-lg font-bold text-slate-800">
            No announcements found
          </h3>

          <p class="mt-2 text-sm text-slate-500">
            There are currently no announcements under this category.
          </p>

          <button
            type="button"
            @click="selectedCategory = 'All'"
            class="mt-5 font-semibold text-blue-700 hover:underline"
          >
            View all announcements
          </button>
        </div>

      </div>
    </section>

  </main>
</template>
