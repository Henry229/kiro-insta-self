import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Load test environment variables
    env: {
      DATABASE_URL: 'file:./test.db',
    },
    // Run tests sequentially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Exclude Playwright test files
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/**', // Exclude Playwright tests directory
      '**/*.spec.ts', // Exclude .spec.ts files (Playwright convention)
    ],
    // Only include test files in __tests__ directory
    include: ['**/__tests__/**/*.test.{js,ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
