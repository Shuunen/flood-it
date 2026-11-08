import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { uniqueMark } from 'shuutils/plugins'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    tailwindcss(),
    uniqueMark(),
  ],
  // dedicated ports, so apps never collide when running together
  preview: { port: 4101, strictPort: true },
  server: { port: 5101, strictPort: true },
})
