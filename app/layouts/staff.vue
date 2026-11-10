<script setup lang="ts">
const route = useRoute()
const { getMe } = useBackend()
const me = await getMe()

const links = [
  { label: 'Dashboard', to: '/staff' },
  { label: 'Flood reports', to: '/staff/flood-reports' },
  { label: 'Announcements', to: '/staff/announcements' }
]
</script>

<template>
  <div class="admin-frame">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">N</span><span>NioGabay<span class="brand-dot">.</span></span></div>
      <div class="role-label">STAFF DASHBOARD</div>
      <nav class="nav-list" aria-label="Staff dashboard">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="nav-link" :class="{ active: route.path === link.to }">{{ link.label }}</NuxtLink>
      </nav>
      <div class="sidebar-footer"><div class="avatar">{{ me.full_name.charAt(0) }}</div><div><strong>{{ me.full_name }}</strong><small>{{ me.position_title }}</small></div></div>
    </aside>
    <main class="admin-main">
      <header class="topbar"><div><span class="eyebrow">BARANGAY NIOG · BACOOR, CAVITE</span><h1>{{ links.find(link => link.to === route.path)?.label ?? 'Staff dashboard' }}</h1></div><div class="connection"><span class="status-dot"></span> Mock data mode</div></header>
      <slot />
    </main>
  </div>
</template>
