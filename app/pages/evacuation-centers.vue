
<script setup>
useHead({
  title: 'Evacuation Centers | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'View evacuation center locations and availability in Barangay Niog.'
    }
  ]
})

// TEMPORARY MOCK DATA
// Will be replaced with GET /api/public/evacuation-centers

const evacuationCenters = [
  {
    id: 1,
    name: 'Niog Elementary School',
    address: 'Niog I, Bacoor, Cavite',
    latitude: null,
    longitude: null,
    capacity: 150,
    contact_person: 'School Representative',
    contact_number: '09XX XXX XXXX',
    is_open: true
    // notes: 'Sample information. Replace with verified details.'
  }
]
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
            Available Evacuation Centers
          </h2>
        </div>

        <!-- CENTER CARDS -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

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
              {{ center.address }}
            </p>

            <!-- CENTER INFORMATION -->
            <div class="mt-5 space-y-4 border-t border-slate-100 pt-5">

              <!-- CAPACITY -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Capacity
                </p>
                <p class="mt-1 font-semibold text-slate-700">
                  {{ center.capacity }} people
                </p>
              </div>

              <!-- PERSON IN CHARGE -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Person in Charge
                </p>
                <p class="mt-1 font-semibold text-slate-700">
                  {{ center.contact_person }}
                </p>
              </div>

              <!-- CONTACT NUMBER -->
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Contact Number
                </p>
                <p class="mt-1 font-semibold text-blue-800">
                  {{ center.contact_number }}
                </p>
              </div>

            </div>

            <!-- NOTES - ADD ONLY WHEN NEEDED -->
            <!--
            <div class="mt-5 rounded-lg bg-slate-50 p-4">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
                Additional Information
              </p>

              <p class="mt-2 text-sm leading-relaxed text-slate-600">
                {{ center.notes }}
              </p>
            </div>
            -->

          </article>
        </div>

      </div>
    </section>

  </main>
</template>
