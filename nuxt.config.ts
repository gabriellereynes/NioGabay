// NioGabay/nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  typescript: {
    serverTsConfig: {
      compilerOptions: {
        types: ['node'],
      },
    },

    nodeTsConfig: {
      compilerOptions: {
        types: ['node'],
      },
    },
  },

  runtimeConfig: {
    supabaseServiceRoleKey: '',
    public: {
      supabaseUrl: '',
      supabasePublishableKey: '',
    },
  },
})