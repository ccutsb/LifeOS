import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera todos los íconos PWA + apple-touch-icon + favicon a partir de public/logo.svg
// Ejecutar:  npm run generate:pwa-assets
export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
})
