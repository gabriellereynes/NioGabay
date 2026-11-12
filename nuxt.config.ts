
import tailwindcss from '@tailwindcss/vite'

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

  css: ['~/assets/css/tailwind.css', '~/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  runtimeConfig: {
    supabaseServiceRoleKey: '',
    public: {
      supabaseUrl: '',
      supabasePublishableKey: '',
    },
  },
})
