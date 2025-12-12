'use client';

import { useCallback } from 'react';
import { usePlanGateModal } from './PlanGateModalContext';
import { PlanForbiddenError } from '@/lib/api/client';

export function useHandlePlanForbidden() {
  const { open } = usePlanGateModal();

  const handlePlanForbidden = useCallback(
    (error: unknown): boolean => {
      if (error instanceof PlanForbiddenError) {
        open({ featureKey: error.featureKey });
        return true;
      }
      return false;
    },
    [open]
  );

  return handlePlanForbidden;
}
