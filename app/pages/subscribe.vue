
<script setup>
import { ref } from 'vue'

useHead({
  title: 'Subscribe to SMS Alerts | NioGabay',
  meta: [
    {
      name: 'description',
      content: 'Register to receive flood alerts and important announcements from NioGabay.'
    }
  ]
})

// FORM DATA
const formData = ref({
  full_name: '',
  phone_number: '',
  purok_street: '',
  consent: false
})

// TEMPORARY DEMO MESSAGE
const message = ref('')

function submitForm() {
  // The backend is not connected yet.
  // This only demonstrates the form submission.

  message.value = 'This is a demo form. Your information has not been submitted or saved.'

  console.log('Form data:', formData.value)
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
          SMS Flood Alerts
        </h1>

        <p class="mt-4 max-w-2xl leading-relaxed text-blue-100">
          Stay informed even when you are away from the NioGabay website.
          Subscribe to receive flood alerts and important community updates
          through SMS.
        </p>
      </div>
    </section>

    <!-- SUBSCRIPTION FORM -->
    <section class="px-5 py-12 md:px-8">
      <div class="mx-auto max-w-3xl">

        <div class="mb-8 text-center">
          <h2 class="text-2xl font-bold text-slate-900">
            Register for SMS Alerts
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            Please provide the information below to register.
          </p>
        </div>

        <form
          @submit.prevent="submitForm"
          class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >

          <!-- FULL NAME -->
          <div class="mb-6">
            <label
              for="full_name"
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Full Name
            </label>

            <input
              id="full_name"
              v-model="formData.full_name"
              type="text"
              placeholder="Enter your full name"
              required
              class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <!-- PHONE NUMBER -->
          <div class="mb-6">
            <label
              for="phone_number"
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Mobile Number
            </label>

            <input
              id="phone_number"
              v-model="formData.phone_number"
              type="tel"
              placeholder="Enter your mobile number"
              required
              class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <p class="mt-2 text-xs text-slate-500">
              Enter the mobile number where you want to receive SMS alerts.
            </p>
          </div>

          <!-- PUROK / STREET -->
          <div class="mb-6">
            <label
              for="purok_street"
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Purok / Street
            </label>

            <input
              id="purok_street"
              v-model="formData.purok_street"
              type="text"
              placeholder="Enter your Purok or street"
              required
              class="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <!-- PRIVACY AND CONSENT -->
          <div class="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">

            <h3 class="font-bold text-slate-900">
              SMS Notification Consent
            </h3>

            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              By subscribing, you agree to receive SMS flood alerts and
              important safety announcements from NioGabay. Your mobile
              number will be used for these notifications.
            </p>

            <label class="mt-4 flex items-start gap-3 text-sm text-slate-700">
              <input
                v-model="formData.consent"
                type="checkbox"
                required
                class="mt-1 h-4 w-4 accent-blue-700"
              />

              <span>
                I have read and understood the information above, and I agree
                to receive SMS alerts from NioGabay.
              </span>
            </label>

          </div>

          <!-- SUBMIT BUTTON -->
          <button
            type="submit"
            class="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Subscribe to SMS Alerts
          </button>

          <!-- DEMO MESSAGE -->
          <div
            v-if="message"
            class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            role="status"
          >
            {{ message }}
          </div>

        </form>

      </div>
    </section>

  </main>
</template>
