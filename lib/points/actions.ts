'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '../session'
import { fail, succeedWith, type ActionResult } from '../action-result'
import { guard, minutes } from '../rate-limit'
import { recalculateAllPoints } from './award'

/**
 * Super-admin safety valve: rebuild the whole ledger from tournament
 * results (e.g. after changing POINTS_CONFIG). Every change is audited as
 * RECALCULATED. There is no way to hand out arbitrary points.
 */
export async function recalculatePoints(): Promise<ActionResult<{ tournaments: number; changed: number }>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SUPER_ADMIN') return fail('Faqat super admin uchun')

  const limited = guard(`points-recalc:${user.id}`, 5, minutes(10))
  if (limited) return limited

  try {
    const result = await recalculateAllPoints(user.id)
    revalidatePath('/rankings')
    revalidatePath('/profile')
    return succeedWith(result)
  } catch (error) {
    console.error('recalculatePoints failed', error)
    return fail('Qayta hisoblashda xatolik')
  }
}
