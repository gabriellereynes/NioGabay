
<script setup lang="ts">
useHead({
  title: 'Announcements | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'View the latest flood advisories, evacuation notices, and public announcements from Barangay Niog.'
    }
  ]
})

// FETCH ALL PUBLISHED ANNOUNCEMENTS
const {
  announcements,
  pending,
  errorMessage
} = useAnnouncements()

// CATEGORY FILTERS
const categories = [
  'All',
  'Flood',
  'Evacuation',
  'Advisory',
  'General'
]

const selectedCategory = ref('All')

// CATEGORY LABELS
const getAnnouncementCategory = (category: string) => {
  const categoryLabels: Record<string, string> = {
    flood: 'Flood',
    evacuation: 'Evacuation',
    advisory: 'Advisory',
    general: 'General'
  }

  return categoryLabels[category.toLowerCase()] ?? 'General'
}

// CATEGORY COLORS
function categoryStyle(category: string) {
  const styles: Record<string, string> = {
    Flood: 'bg-red-100 text-red-800',
    Evacuation: 'bg-amber-100 text-amber-800',
    Advisory: 'bg-blue-100 text-blue-800',
    General: 'bg-slate-100 text-slate-700'
  }

  return styles[category] ?? 'bg-slate-100 text-slate-700'
}

// FILTER ANNOUNCEMENTS
const filteredAnnouncements = computed(() => {
  if (selectedCategory.value === 'All') {
    return announcements.value
  }

  return announcements.value.filter(
    announcement =>
      getAnnouncementCategory(announcement.category) === selectedCategory.value
  )
})

// FORMAT ANNOUNCEMENT DATE
const formatAnnouncementDate = (
  timestamp: string | null | undefined
) => {
  if (!timestamp) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeZone: 'Asia/Manila'
  }).format(new Date(timestamp))
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

        <!-- LOADING STATE -->
        <div
          v-if="pending && announcements.length === 0"
          class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"
        >
          <p class="text-sm text-slate-500">
            Loading announcements...
          </p>
        </div>

        <!-- ERROR STATE -->
        <div
          v-else-if="errorMessage && announcements.length === 0"
          class="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
        >
          <h3 class="text-lg font-bold text-red-800">
            Unable to load announcements
          </h3>

          <p class="mt-2 text-sm text-red-700">
            {{ errorMessage }}
          </p>
        </div>

        <!-- ANNOUNCEMENT CARDS -->
        <div
          v-else-if="filteredAnnouncements.length > 0"
          class="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          <article
            v-for="announcement in filteredAnnouncements"
            :key="announcement.id"
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md md:p-7"
          >

            <!-- CATEGORY TAG AND DATE -->
            <div class="flex flex-wrap items-center justify-between gap-3">

              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="categoryStyle(getAnnouncementCategory(announcement.category))"
              >
                {{ getAnnouncementCategory(announcement.category) }}
              </span>

              <span class="text-xs text-slate-400">
                {{ formatAnnouncementDate(announcement.published_at) }}
              </span>

            </div>

            <!-- TITLE -->
            <h3 class="mt-5 break-words text-xl font-bold leading-snug text-slate-900">
              {{ announcement.title }}
            </h3>

            <!-- DESCRIPTION -->
            <p class="mt-3 break-words text-sm leading-relaxed text-slate-600">
              {{ announcement.body }}
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
