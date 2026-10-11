import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  // Make .env visible to globalSetup too (it runs in this process).
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) process.env[key] ??= value

  return {
    resolve: {
      alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
      globalSetup: ['tests/global-setup.ts'],
      setupFiles: ['tests/setup-env.ts'],
      // Integration tests share one MySQL database — run files one at a time.
      fileParallelism: false,
      testTimeout: 30_000,
    },
  }
})
