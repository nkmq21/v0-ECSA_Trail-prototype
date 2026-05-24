export enum AppSuccessCodes {
  OK = 'OK',
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

export enum AppErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DUPLICATE = 'DUPLICATE',
  AI_PREMIUM_REQUIRED = 'AI_PREMIUM_REQUIRED',
}

export enum AppInfoCodes {
  NO_CHANGE = 'NO_CHANGE',
}

export interface GenericResponse<T = null> {
  data: T
  code: AppSuccessCodes | AppErrorCodes | AppInfoCodes
  type: 'success' | 'error' | 'info' | 'warning'
  message?: string
}

export function parseSupabaseError(error: { message?: string; code?: string }): string {
  if (error.code === '23505') return 'Record already exists.'
  if (error.code === '23503') return 'Referenced record not found.'
  if (error.code === '42501') return 'Permission denied.'
  if (error.code === '23514') return 'Constraint violation.'
  return error.message ?? 'An unexpected error occurred.'
}
