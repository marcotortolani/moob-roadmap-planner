import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use 'node' for pure-logic tests (lib, hooks).
    // Override with @vitest-environment happy-dom docblock in component tests.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/hooks/**'],
      exclude: ['src/components/ui/**', 'src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
