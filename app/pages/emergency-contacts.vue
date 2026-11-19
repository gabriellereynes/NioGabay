
<script setup lang="ts">
useHead({
  title: 'Emergency Contacts | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'Find important emergency contact numbers for residents of Barangay Niog.'
    }
  ]
})

// FETCH EMERGENCY CONTACTS FROM PUBLIC API
const {
  emergencyContacts,
  pending,
  errorMessage,
  refresh
} = useEmergencyContacts()

// EMERGENCY CONTACT CATEGORY COLORS
const getCategoryClass = (category: string | null) => {
  switch (category?.toLowerCase()) {
    case 'barangay':
      return 'bg-blue-100 text-blue-800'

    case 'police':
      return 'bg-indigo-100 text-indigo-800'

    case 'fire':
      return 'bg-red-100 text-red-800'

    case 'bdrrmo':
      return 'bg-purple-100 text-purple-800'

    case 'medical':
      return 'bg-green-100 text-green-800'

    default:
      return 'bg-slate-100 text-slate-700'
  }
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
          Emergency Contacts
        </h1>

        <p class="mt-4 max-w-2xl leading-relaxed text-blue-100">
          Keep important emergency contact numbers accessible.
          Know who to contact when you need immediate assistance.
        </p>
      </div>
    </section>

    <!-- EMERGENCY CONTACTS CONTENT -->
    <section class="px-5 py-12 md:px-8">
      <div class="mx-auto max-w-7xl">

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900">
            Important Contact Numbers
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            View important emergency contact numbers for Barangay Niog.
          </p>
        </div>

        <!-- LOADING MESSAGE -->
        <div
          v-if="pending && emergencyContacts.length === 0"
          class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
        >
          <p class="text-sm text-slate-500">
            Loading emergency contacts...
          </p>
        </div>

        <!-- ERROR MESSAGE -->
        <div
          v-else-if="errorMessage && emergencyContacts.length === 0"
          class="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        >
          <p>
            Unable to load emergency contacts: {{ errorMessage }}
          </p>

          <button
            type="button"
            class="mt-3 font-semibold underline hover:text-red-900"
            @click="refresh()"
          >
            Try Again
          </button>
        </div>

        <!-- EMPTY MESSAGE -->
        <div
          v-else-if="emergencyContacts.length === 0"
          class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
        >
          <p class="text-sm text-slate-500">
            No emergency contacts available.
          </p>
        </div>

        <!-- CONTACT CARDS -->
        <div
          v-else
          class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >

          <article
            v-for="contact in emergencyContacts"
            :key="contact.id"
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <!-- CONTACT NAME -->
            <h3 class="text-xl font-bold leading-snug text-slate-900">
              {{ contact.name }}
            </h3>

            <!-- CATEGORY TAG -->
            <span
              v-if="contact.category"
              class="mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
              :class="getCategoryClass(contact.category)"
            >
              {{ contact.category }}
            </span>

            <!-- CONTACT NUMBER -->
            <div class="mt-5 border-t border-slate-100 pt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contact Number
              </p>

              <p class="mt-2 whitespace-pre-line text-lg font-bold leading-tight text-blue-800">
                {{ contact.number }}
              </p>
            </div>

          </article>

        </div>

      </div>
    </section>

    <!-- SAFETY REMINDER -->
    <section class="px-5 pb-12 md:px-8">
      <div class="mx-auto max-w-7xl rounded-2xl border border-blue-200 bg-blue-50 p-6 md:p-8">
        <h2 class="text-lg font-bold text-blue-900">
          Emergency Reminder
        </h2>

        <p class="mt-2 text-sm leading-relaxed text-blue-800">
          During an emergency, remain calm and provide accurate information
          when contacting emergency responders. Follow official barangay
          announcements and evacuation instructions.
        </p>
      </div>
    </section>

  </main>
</template>
