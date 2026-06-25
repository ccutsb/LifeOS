import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true, // accesible desde el iPhone en la misma red (probar la PWA real)
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Genera íconos + splash de iOS desde public/logo.svg (ver pwa-assets.config.ts)
      pwaAssets: {
        disabled: false,
        config: true,
      },
      manifest: {
        id: '/',
        name: 'LifeOS',
        short_name: 'LifeOS',
        description: 'Tu sistema de vida: universidad, hábitos, finanzas y enfoque.',
        lang: 'es-CL',
        theme_color: '#F5F7FE',
        background_color: '#F5F7FE',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'education', 'lifestyle'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // Inyecta los manejadores de Web Push (push / notificationclick)
        importScripts: ['/push-sw.js'],
        runtimeCaching: [
          {
            // Cachea respuestas de Supabase para lectura offline (NetworkFirst)
            urlPattern: ({ url }) => url.hostname.endsWith('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // actívalo si quieres probar el SW en `npm run dev`
        type: 'module',
      },
    }),
  ],
})
