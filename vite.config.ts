/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// El `base` debe coincidir con el nombre del repositorio en GitHub Pages.
// Ej.: https://usuario.github.io/vetnote/  ->  base = '/vetnote/'
// Configurable con VITE_BASE_PATH para no acoplar el código al nombre del repo.
const base = process.env.VITE_BASE_PATH ?? '/vetnote/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // no forzar recarga si hay una consulta sin guardar
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'VetNote — Notas clínicas veterinarias',
        short_name: 'VetNote',
        description: 'Registro de pacientes y consultas veterinarias con notas para WhatsApp.',
        theme_color: '#2F6F64',
        background_color: '#F5F7F6',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // No cachear las llamadas al Web App de Apps Script: siempre red.
        navigateFallbackDenylist: [/^\/exec/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
