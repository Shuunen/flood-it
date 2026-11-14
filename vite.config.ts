import { preact } from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { uniqueMark } from 'shuutils/plugins'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  build: { reportCompressedSize: false },
  plugins: [preact(), tailwindcss(), uniqueMark()],
  // dedicated ports, so apps never collide when running together
  preview: { port: 4101, strictPort: true },
  server: { port: 5101, strictPort: true },
})
