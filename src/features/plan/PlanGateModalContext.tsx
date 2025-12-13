'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ProUpsellModal } from './ProUpsellModal';

type OpenOptions = {
  featureKey?: string;
};

type PlanGateModalContextType = {
  open: (options?: OpenOptions) => void;
  close: () => void;
};

const PlanGateModalContext = createContext<PlanGateModalContextType | undefined>(undefined);

export function usePlanGateModal() {
  const context = useContext(PlanGateModalContext);
  if (!context) {
    throw new Error('usePlanGateModal must be used within a PlanGateModalProvider');
  }
  return context;
}

type Props = {
  children: ReactNode;
};

export function PlanGateModalProvider({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [featureKey, setFeatureKey] = useState<string | undefined>(undefined);

  const open = useCallback((options?: OpenOptions) => {
    setFeatureKey(options?.featureKey);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setFeatureKey(undefined);
  }, []);

  return (
    <PlanGateModalContext.Provider value={{ open, close }}>
      {children}
      <ProUpsellModal isOpen={isOpen} featureKey={featureKey} onClose={close} />
    </PlanGateModalContext.Provider>
  );
}
