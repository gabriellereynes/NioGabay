<script setup lang="ts">
import Swal from 'sweetalert2'
// A "Log out" button. Place <LogoutButton /> anywhere (e.g., in Navbar.vue or headers).
const { logout } = useAuth()

const busy = ref(false)
const error = ref('')

const submit = async () => {
  const result = await Swal.fire({
    title: 'Are you sure you want to log out?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Log out',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    reverseButtons: true
  })

  if (!result.isConfirmed) return

  busy.value = true
  error.value = ''

  try {
    await logout()
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
  margin-left: auto;
}
.error {
  color: #b00020;
  font-size: 0.875rem;
}
</style>