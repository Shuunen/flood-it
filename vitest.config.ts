import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: { exclude: ['src/**/*.test.*', 'src/**/*.d.ts'], include: ['src/**/*.{ts,tsx}'], thresholds: { 100: true } },
      environment: 'happy-dom',
      globals: true,
      pool: 'threads',
    },
  }),
)
