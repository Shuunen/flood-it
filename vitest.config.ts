import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: { exclude: ['src/**/*.test.*', 'src/**/*.d.ts'], include: ['src/logic/**/*.ts', 'src/game/state.ts'], thresholds: { 100: true } },
    environment: 'node',
    globals: true,
    pool: 'threads',
    reporters: ['dot'],
    silent: true,
  },
})
