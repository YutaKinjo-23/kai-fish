'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getMe } from './getMe';
import type { MeResponse } from './types';

type MeContextValue = {
  me: MeResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export const MeContext = createContext<MeContextValue | null>(null);

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMe();
      setMe(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      setMe(null);
      setError(message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const value = useMemo<MeContextValue>(() => {
    return { me, loading, error, refetch };
  }, [me, loading, error, refetch]);

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}
