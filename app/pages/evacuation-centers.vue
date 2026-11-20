
<script setup lang="ts">
useHead({
  title: 'Evacuation Centers | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'View evacuation center locations and availability in Barangay Niog.'
    }
  ]
})

const {
  centers: evacuationCenters,
  pending,
  errorMessage
} = useEvacuationCentersAdmin()
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
          Evacuation Centers
        </h1>

        <p class="mt-4 max-w-2xl leading-relaxed text-blue-100">
          Find evacuation centers and check their availability.
          Stay informed and know where to go during emergencies.
        </p>
      </div>
    </section>

    <!-- EVACUATION CENTER CONTENT -->
    <section class="px-5 py-12 md:px-8">
      <div class="mx-auto max-w-7xl">

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900">
            Evacuation Centers
          </h2>
        </div>

        <div v-if="pending" class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p class="text-sm text-slate-500">Loading evacuation centers...</p>
        </div>

        <div v-else-if="errorMessage" class="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center" role="alert">
          <h3 class="text-lg font-bold text-red-800">Unable to load evacuation centers</h3>
          <p class="mt-2 text-sm text-red-700">{{ errorMessage }}</p>
        </div>

        <div v-else-if="evacuationCenters.length === 0" class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p class="text-sm text-slate-500">No evacuation centers yet.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

          <article
            v-for="center in evacuationCenters"
            :key="center.id"
            class="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <!-- STATUS -->
            <div class="mb-5 flex items-center justify-between gap-3">
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Evacuation Center
              </span>

              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="center.is_open
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'"
              >
                {{ center.is_open ? 'Open' : 'Closed' }}
              </span>
            </div>

            <!-- NAME AND ADDRESS -->
            <h3 class="text-xl font-bold leading-snug text-slate-900">
              {{ center.name }}
            </h3>

            <p class="mt-3 text-sm leading-relaxed text-slate-600">
              <span class="font-semibold text-slate-700">Address:</span>
              {{ center.address || 'Not provided' }}
            </p>

            <!-- CENTER INFORMATION -->
            <div class="mt-5 space-y-4 border-t border-slate-100 pt-5">

              <!-- CAPACITY -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Capacity
                </p>
                <p class="mt-1 font-semibold text-slate-700">
                  {{ center.capacity ?? 'Not specified' }}{{ center.capacity === null ? '' : ' people' }}
                </p>
              </div>

              <!-- PERSON IN CHARGE -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Person in Charge
                </p>
                <p class="mt-1 font-semibold text-slate-700">
                  {{ center.contact_person || 'Not provided' }}
                </p>
              </div>

              <!-- CONTACT NUMBER -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Contact Number
                </p>
                <p class="mt-1 font-semibold text-blue-800">
                  {{ center.contact_number || 'Not provided' }}
                </p>
              </div>

            </div>

            <div v-if="center.notes" class="mt-5 rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                Additional Information
              </p>

              <p class="mt-2 text-sm leading-relaxed text-slate-600">
                {{ center.notes }}
              </p>
            </div>

          </article>
        </div>

      </div>
    </section>

  </main>
</template>
