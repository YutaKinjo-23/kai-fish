'use client';

import { ReactNode } from 'react';
import { PlanGateModalProvider } from '@/features/plan/PlanGateModalContext';

export function Providers({ children }: { children: ReactNode }) {
  return <PlanGateModalProvider>{children}</PlanGateModalProvider>;
}
