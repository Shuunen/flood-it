import vue from '@vitejs/plugin-vue'
// eslint-disable-next-line @typescript-eslint/no-shadow
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('sl-'),
        },
      },
    }),
  ],
  resolve: {
    alias: {
      // eslint-disable-next-line total-functions/no-partial-url-constructor
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
})
