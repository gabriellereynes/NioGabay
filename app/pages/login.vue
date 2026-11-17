
<script setup lang="ts">
import { Mail, Lock, Eye, EyeOff } from '@lucide/vue'

useHead({
  title: 'Login | NioGabay',
})

const { login } = useAuth()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
const showPassword = ref(false)

const safeRedirect = (role: 'admin' | 'staff') => {
  const target = route.query.redirect
  const ok = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')

  if (!ok) return role === 'admin' ? '/system-admin' : '/staff'
  if (target.startsWith('/system-admin') && role !== 'admin') return '/staff'
  if (target.startsWith('/staff') && role !== 'admin' && role !== 'staff') return '/staff'

  return target
}

const submit = async () => {
  error.value = ''
  busy.value = true

  try {
    const person = await login({ email: email.value, password: password.value })
    await navigateTo(safeRedirect(person.role))
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.statusMessage || 'Could not log in. Please try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">

    <!-- NIOGABAY BRAND -->
    <header class="flex justify-center px-5 pt-8 pb-0">
      <NuxtLink
        to="/"
        class="text-2xl font-bold tracking-tight text-blue-900 transition hover:text-blue-700"
      >
        NioGabay
      </NuxtLink>
    </header>

    <!-- LOGIN SECTION -->
    <main class="flex items-center justify-center px-5 pt-8 pb-10">

      <!-- LOGIN CARD -->
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

        <!-- HEADER -->
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold tracking-tight text-blue-900">
            Welcome Back
          </h1>

          <p class="mt-2 text-sm text-slate-600">
            Sign in to access the NioGabay monitoring system.
          </p>
        </div>

        <!-- LOGIN FORM -->
        <form @submit.prevent="submit" class="grid gap-5">

          <!-- EMAIL -->
          <div>
            <label
              for="email"
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email Address
            </label>

            <div class="relative">
              <Mail
                :size="18"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="Enter your email"
                autocomplete="username"
                required
                class="w-full rounded-lg border border-slate-300 py-3 !pl-11 !pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <!-- PASSWORD -->
          <div>
            <label
              for="password"
              class="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <div class="relative">
              <Lock
                :size="18"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                class="w-full rounded-lg border border-slate-300 py-3 !pl-11 !pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              <!-- SHOW / HIDE PASSWORD -->
              <button
                type="button"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-700"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <!-- ERROR MESSAGE -->
          <div
            v-if="error"
            class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {{ error }}
          </div>

          <!-- LOGIN BUTTON -->
          <button
            type="submit"
            :disabled="busy"
            class="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ busy ? 'Signing in...' : 'Sign In' }}
          </button>

        </form>

        <!-- FOOTER -->
        <p class="mt-6 text-center text-xs pt-5 text-slate-500">
          Authorized Personnel Only
        </p>

      </div>
    </main>
  </div>
</template>
