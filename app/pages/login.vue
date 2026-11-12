<script setup lang="ts">
// Plain working login page. Whoever owns the staff-side design can restyle it freely;
// keep the script part, which is what talks to the server.
const { login } = useAuth()
const route = useRoute()
 
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)
 
// After login, go back to the page the person wanted, but only to a page on THIS site.
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
  <main class="login">
    <h1>NioGabay</h1>
    <p>Sign in as a system administrator or staff member.</p>
 
    <form @submit.prevent="submit">
      <label>
        Email
        <input v-model="email" type="email" autocomplete="username" required :disabled="busy">
      </label>
      <label>
        Password
        <input v-model="password" type="password" autocomplete="current-password" required :disabled="busy">
      </label>
 
      <p v-if="error" class="error" role="alert">{{ error }}</p>
 
      <button type="submit" :disabled="busy">{{ busy ? 'Logging in...' : 'Log in' }}</button>
    </form>

  </main>
</template>
 
<style scoped>
.login { max-width: 22rem; margin: 4rem auto; padding: 0 1rem; }
form { display: grid; gap: 1rem; }
label { display: grid; gap: 0.25rem; font-weight: 600; }
input { padding: 0.6rem; font: inherit; border: 1px solid #888; border-radius: 6px; }
button { padding: 0.7rem; font: inherit; font-weight: 600; border-radius: 6px; cursor: pointer; }
.error { color: #b00020; margin: 0; }
</style>