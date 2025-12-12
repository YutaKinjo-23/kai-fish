'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FeatureKey, Plan } from '@/lib/plan/features';

interface MeResponse {
  id: string;
  plan: Plan;
  features: FeatureKey[];
}

interface UseFeaturesResult {
  plan: Plan | null;
  features: FeatureKey[];
  loading: boolean;
  error: string | null;
  hasFeature: (featureKey: FeatureKey) => boolean;
  refetch: () => Promise<void>;
}

/**
 * /api/me をfetchしてfeatures情報を保持するhook
 *
 * 【SSRでの利用について】
 * Server Componentで使用したい場合は、以下のようにサーバー側で直接呼び出す:
 *
 * ```ts
 * // Server Component内
 * import { getCurrentUser } from '@/lib/auth/getCurrentUser';
 * import { getEnabledFeatures, hasFeature } from '@/lib/plan/features';
 *
 * const user = await getCurrentUser();
 * const features = user ? getEnabledFeatures(user.plan) : [];
 * const canUseAdvanced = user ? hasFeature(user.plan, 'dashboard.advanced') : false;
 * ```
 */
export function useFeatures(): UseFeaturesResult {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<FeatureKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/me');
      if (!res.ok) {
        if (res.status === 401) {
          // 未認証はエラーではなく、単にfeatureなし
          setPlan(null);
          setFeatures([]);
          return;
        }
        throw new Error('Failed to fetch user info');
      }
      const data = (await res.json()) as MeResponse;
      setPlan(data.plan);
      setFeatures(data.features);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const hasFeature = useCallback(
    (featureKey: FeatureKey): boolean => {
      return features.includes(featureKey);
    },
    [features]
  );

  return {
    plan,
    features,
    loading,
    error,
    hasFeature,
    refetch: fetchMe,
  };
}
