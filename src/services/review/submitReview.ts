'use server'

import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import createClient from '@/utils/supabase/server'
import { withServerAction } from '@/utils/actionWrapper'
import { AppSuccessCodes } from '@/lib/errors'

const SubmitReviewSchema = z.object({
  planId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable().optional(),
  commentVi: z.string().max(2000).nullable().optional(),
})

export const submitReview = withServerAction(SubmitReviewSchema, async ({ planId, rating, comment, commentVi }, { userId }) => {
  const supabase = await createClient()

  const { error: insertError } = await supabase.from('review').insert({
    user_id: userId,
    plan_id: planId,
    rating,
    comment: comment ?? null,
    comment_vi: commentVi ?? null,
  })
  if (insertError) throw insertError

  const { error: ratingError } = await supabase.rpc('recalculate_plan_rating', { p_plan_id: planId })
  if (ratingError) throw ratingError

  revalidateTag(`_rvw_pln_${planId}`, 'minutes')
  revalidateTag('_mkt', 'minutes')

  return { data: null, code: AppSuccessCodes.CREATED, type: 'success' as const }
})
