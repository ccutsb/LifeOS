import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Config separada del build: los tests cubren la lógica pura de dominio
// (notas, Eisenhower, rachas, dinero) sin cargar el plugin PWA ni el DOM.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
