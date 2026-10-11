'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '../session'
import { fail, succeedWith, type ActionResult } from '../action-result'
import { guard, minutes } from '../rate-limit'
import { recalculateAllPoints } from './award'
import { getI18n } from '../i18n/server'

/**
 * Super-admin safety valve: rebuild the whole ledger from tournament
 * results (e.g. after changing POINTS_CONFIG). Every change is audited as
 * RECALCULATED. There is no way to hand out arbitrary points.
 */
export async function recalculatePoints(): Promise<ActionResult<{ tournaments: number; changed: number }>> {
  const { dict, locale } = await getI18n()
  const user = await getCurrentUser()
  if (!user || user.role !== 'SUPER_ADMIN') return fail(dict.errors.super_admin_only)

  const limited = guard(`points-recalc:${user.id}`, 5, minutes(10), locale)
  if (limited) return limited

  try {
    const result = await recalculateAllPoints(user.id)
    revalidatePath('/rankings')
    revalidatePath('/profile')
    return succeedWith(result)
  } catch (error) {
    console.error('recalculatePoints failed', error)
    return fail(dict.errors.recalculate_failed)
  }
}
