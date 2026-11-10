<script setup lang="ts">
// A "Log out" button. Place <LogoutButton /> anywhere (e.g., in Navbar.vue or headers).
const { logout } = useAuth()

const busy = ref(false)
const error = ref('')

const submit = async () => {
  busy.value = true
  error.value = ''
  try {
    await logout() // Calls POST /api/auth/logout, clears cookie & resets me.value
    await navigateTo('/login')
  } catch {
    error.value = 'Could not log out. Check your connection and try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <span class="logout-wrapper">
    <button type="button" :disabled="busy" @click="submit">
      {{ busy ? 'Logging out...' : 'Log out' }}
    </button>
    <span v-if="error" class="error" role="alert">{{ error }}</span>
  </span>
</template>

<style scoped>
.logout-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.error {
  color: #b00020;
  font-size: 0.875rem;
}
</style>