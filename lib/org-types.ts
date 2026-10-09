/**
 * Shared types for organization provisioning.
 *
 * Kept out of `lib/org-actions.ts` because every export of a `'use server'`
 * module must be an async function.
 */
export type ProvisionedCredentials = {
  organizationName: string
  username: string
  email: string
  password: string
}
