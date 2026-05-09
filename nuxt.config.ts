// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app/',

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  vite: {
    optimizeDeps: {
      include: ['msw/browser', 'msw'],
    },
  },

  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  eslint: {
    config: {
      typescript: true,
    },
  },

  nitro: {
    prerender: {
      failOnError: false,
    },
  },

  i18n: {
    defaultLocale: 'zh-TW',
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json' },
      { code: 'zh-TW', language: 'zh-TW', file: 'zh-TW.json' },
    ],
    langDir: 'locales',
    strategy: 'prefix_except_default',
  },
})
