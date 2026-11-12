
<script setup>
useHead({
  title: 'Emergency Contacts | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'Find important emergency contact numbers for residents of Barangay Niog.'
    }
  ]
})

// TEMPORARY MOCK DATA??
// Will be replaced with GET /api/public/emergency-contacts??

const emergencyContacts = [
  {
    id: 1,
    name: 'Barangay Niog Office',
    category: 'Barangay',
    number: '0951 775 5230\n(046) 423 - 5419' 
  },

  {
    id: 2,
    name: 'Barangay PNP',
    category: 'Barangay',
    number: '0977 752 0819\n0998 598 5593\n(046) 416 - 7510' 
  },

  {
    id: 3,
    name: 'BDRRMO',
    category: 'Barangay',
    number: '161 / (046) 417 - 0727' 
  },

  {
    id: 1,
    name: 'BFP - BACOOR',
    category: 'Barangay',
    number: '0966 6959 711' 
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
        </div>

        <!-- CONTACT CARDS -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <article
            v-for="contact in emergencyContacts"
            :key="contact.id"
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >

            <!-- CONTACT NAME -->
            <h3 class="text-xl font-bold leading-snug text-slate-900">
              {{ contact.name }}
            </h3>

            <!-- CONTACT NUMBER -->
            <div class="mt-5 border-t border-slate-100 pt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contact Number
              </p>

              <p class="mt-2 whitespace-pre-line text-lg leading-tight font-bold text-blue-800">
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
