
<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)
const { me } = useAuth()

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Announcements', path: '/announcements' },
  { label: 'Evacuation Centers', path: '/evacuation-centers' },
  { label: 'Emergency Contacts', path: '/emergency-contacts' }
]
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">

    <nav class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">

      <!-- LOGO -->
      <NuxtLink
        to="/"
        class="text-2xl font-bold tracking-tight text-blue-900 transition hover:text-blue-700"
        @click="isMenuOpen = false"
      >
        NioGabay
      </NuxtLink>

      <!-- DESKTOP NAVIGATION -->
      <div class="hidden items-center gap-6 lg:flex">

        <NuxtLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          active-class="text-blue-800 font-bold"
          exact-active-class="text-blue-800 font-bold"
          class="text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          {{ link.label }}
        </NuxtLink>

        <NuxtLink
          to="/subscribe"
          class="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-blue-800"
        >
          Subscribe to SMS Alerts
        </NuxtLink>

        <!-- AUTHENTICATED USER MENU (DESKTOP) -->
        <div v-if="me" class="flex items-center gap-3 border-l border-slate-200 pl-6">
          <span class="text-sm font-medium text-slate-700">
            {{ me.full_name }}
            <span class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 uppercase">{{ me.role }}</span>
          </span>
          <LogoutButton />
        </div>





      </div>

      <!-- MOBILE MENU BUTTON -->
      <button
        type="button"
        class="rounded-lg px-3 py-2 text-2xl text-slate-700 transition hover:bg-slate-100 lg:hidden"
        @click="isMenuOpen = !isMenuOpen"
        :aria-expanded="isMenuOpen"
        aria-label="Toggle navigation menu"
      >
        {{ isMenuOpen ? '✕' : '☰' }}
      </button>

    </nav>

    <!-- MOBILE NAVIGATION -->
    <div
      v-if="isMenuOpen"
      class="border-t border-slate-200 bg-white px-5 py-5 lg:hidden"
    >
      <div class="mx-auto flex max-w-7xl flex-col gap-4">

        <NuxtLink
          v-for="link in navLinks"
          :key="link.path"
          :to="link.path"
          active-class="text-blue-800 font-bold"
          exact-active-class="text-blue-800 font-bold"
          class="text-sm font-medium text-slate-600 transition hover:text-blue-700"
          @click="isMenuOpen = false"
        >
          {{ link.label }}
        </NuxtLink>

        <NuxtLink
          to="/subscribe"
          class="rounded-lg bg-blue-700 px-5 py-3 text-center text-sm font-semibold !text-white transition hover:bg-blue-800"
          @click="isMenuOpen = false"
        >
          Subscribe to SMS Alerts
        </NuxtLink>

        <!-- AUTHENTICATED USER MENU (MOBILE) -->
        <div v-if="me" class="mt-2 flex flex-col gap-3 border-t border-slate-200 pt-4">
          <div class="text-sm font-medium text-slate-700">
            {{ me.full_name }}
            <span class="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 uppercase">{{ me.role }}</span>
          </div>
          <LogoutButton @click="isMenuOpen = false" />
        </div>

      </div>
    </div>

  </header>
</template>
