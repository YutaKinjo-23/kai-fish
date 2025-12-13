import {
  PlanForbiddenError,
  isPlanForbiddenError,
  PLAN_FORBIDDEN_CODE,
} from '@/lib/features/errors';

export { PLAN_FORBIDDEN_CODE };

/**
 * @deprecated Use PlanForbiddenError from '@/lib/features/errors'
 */
export type PlanForbiddenErrorBody = PlanForbiddenError;

/**
 * @deprecated Use isPlanForbiddenError from '@/lib/features/errors'
 */
export const isPlanForbiddenBody = isPlanForbiddenError;
