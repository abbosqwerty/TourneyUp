import { execSync } from 'node:child_process'

/**
 * Integration tests run against DATABASE_URL_TEST, brought up to date with
 * `prisma migrate deploy` (non-destructive). Every test creates its own
 * uniquely named rows, so the database never needs wiping between runs.
 * Without DATABASE_URL_TEST the integration suites are skipped.
 */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST
  if (!url) return
  if (url === process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST must point at a separate test database')
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: url },
  })
}
