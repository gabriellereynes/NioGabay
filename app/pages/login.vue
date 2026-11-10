<template>
  <main class="login-page">
    <section class="login-card">
      <span class="brand-mark">N</span>
      <span class="eyebrow">NIOGABAY ACCESS</span>
      <h1>Sign in to continue</h1>
      <p>Authentication is being integrated by the project leader. This branch currently uses the mock identity configured in <code>useBackend.ts</code>.</p>
      <NuxtLink to="/staff" class="button primary-button">Continue with mock account</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.login-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #eaf3f0; }
.login-card { max-width: 430px; background: white; border: 1px solid #dce8e4; border-radius: 16px; padding: 34px; display: grid; gap: 14px; box-shadow: 0 12px 40px rgba(8, 91, 99, .08); }
.login-card .brand-mark { width: 38px; height: 38px; }
.login-card h1 { margin: 0; font-size: 30px; letter-spacing: -.05em; }
.login-card p { color: #6f7d83; font-size: 14px; line-height: 1.6; margin: 0 0 10px; }
.login-card code { color: #075b63; }
</style>
