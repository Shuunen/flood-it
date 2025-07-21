/// <reference types="vitest" />
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    tailwindcss()
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      all: true,
      exclude: ['src/test-setup.ts'],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100
      }
    }
  },
})
