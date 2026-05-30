'use server'

import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import createClient from '@/utils/supabase/server'
import { withServerAction } from '@/utils/actionWrapper'
import { AppSuccessCodes } from '@/lib/errors'

const PurchasePlanSchema = z.object({
  planId: z.string().uuid(),
  aiTier: z.enum(['per-plan', 'monthly']).nullable().optional(),
})

export const purchasePlan = withServerAction(PurchasePlanSchema, async ({ planId, aiTier }, { userId }) => {
  const supabase = await createClient()

  const { data: purchasedId, error } = await supabase.rpc('purchase_plan_atomic', {
    p_user_id: userId,
    p_plan_id: planId,
    p_ai_tier: aiTier ?? null,
  })
  if (error) throw error

  revalidateTag(`usr_${userId}_pln`, 'minutes')
  revalidateTag('_mkt', 'minutes')

  return { data: { purchasedPlanId: purchasedId as string }, code: AppSuccessCodes.CREATED, type: 'success' as const }
})
