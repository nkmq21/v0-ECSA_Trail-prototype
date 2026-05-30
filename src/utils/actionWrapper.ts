import { z } from 'zod'
import createClient from '@/utils/supabase/server'
import { AppErrorCodes, GenericResponse, parseSupabaseError } from '@/lib/errors'

type ActionHandler<TInput, TOutput> = (
  params: TInput,
  context: { userId: string }
) => Promise<GenericResponse<TOutput>>

export function withServerAction<TSchema extends z.ZodTypeAny, TOutput>(
  schema: TSchema,
  handler: ActionHandler<z.infer<TSchema>, TOutput>
) {
  return async (input: z.infer<TSchema>): Promise<GenericResponse<TOutput | null>> => {
    const parsed = schema.safeParse(input)
    if (!parsed.success) {
      return {
        data: null,
        code: AppErrorCodes.VALIDATION_ERROR,
        type: 'error',
        message: parsed.error.issues.map(i => i.message).join(', '),
      }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, code: AppErrorCodes.UNAUTHORIZED, type: 'error', message: 'Not authenticated.' }
    }

    try {
      return await handler(parsed.data, { userId: user.id })
    } catch (err: unknown) {
      const supaErr = err as { message?: string; code?: string }
      return {
        data: null,
        code: AppErrorCodes.INTERNAL_ERROR,
        type: 'error',
        message: parseSupabaseError(supaErr),
      }
    }
  }
}
