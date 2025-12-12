'use client';

import { usePlanGuard } from '@/hooks/usePlanGuard';

/**
 * @deprecated Use usePlanGuard from '@/hooks/usePlanGuard'
 */
export function useHandlePlanForbidden() {
  const { handlePlanForbidden } = usePlanGuard();
  return handlePlanForbidden;
}
