'use server'

import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import createClient from '@/utils/supabase/server'
import { withServerAction } from '@/utils/actionWrapper'
import { AppSuccessCodes } from '@/lib/errors'

const UpdatePlanStatusSchema = z.object({
  planId: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
})

export const updatePlanStatus = withServerAction(UpdatePlanStatusSchema, async ({ planId, status }, { userId }) => {
  const supabase = await createClient()

  const { data: current, error: fetchError } = await supabase
    .from('plan')
    .select('status, creator_id')
    .eq('id', planId)
    .single()
  if (fetchError) throw fetchError

  const { error: updateError } = await supabase
    .from('plan')
    .update({ status })
    .eq('id', planId)
  if (updateError) throw updateError

  const wasPublished = current.status === 'published'
  const nowPublished = status === 'published'

  if (!wasPublished && nowPublished) {
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('total_plans')
      .eq('id', userId)
      .single()
    if (profileError) throw profileError

    await supabase
      .from('profile')
      .update({ total_plans: (profile.total_plans ?? 0) + 1 })
      .eq('id', userId)

    // Creator auto-owns their own plan
    await supabase
      .from('purchased_plan')
      .upsert({ user_id: userId, plan_id: planId }, { onConflict: 'user_id,plan_id', ignoreDuplicates: true })
  } else if (wasPublished && !nowPublished) {
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('total_plans')
      .eq('id', userId)
      .single()
    if (profileError) throw profileError

    await supabase
      .from('profile')
      .update({ total_plans: Math.max((profile.total_plans ?? 1) - 1, 0) })
      .eq('id', userId)
  }

  revalidateTag(`usr_${userId}_pln`, 'minutes')
  revalidateTag('_mkt', 'minutes')

  return { data: null, code: AppSuccessCodes.UPDATED, type: 'success' as const }
})
