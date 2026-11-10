<script setup lang="ts">
const route = useRoute()
const showPublicNavbar = computed(() =>
  !route.path.startsWith('/staff')
  && !route.path.startsWith('/system-admin')
  && route.path !== '/login'
)
</script>

<template>
  <NuxtRouteAnnouncer />
  <Navbar v-if="showPublicNavbar" />
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>
