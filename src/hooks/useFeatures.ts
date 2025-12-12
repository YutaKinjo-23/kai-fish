'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FeatureKey, Plan } from '@/lib/plan/features';
import { useMe } from '@/features/me/useMe';

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
  const { me, loading, error, refetch } = useMe();
  const plan = me?.plan ?? null;
  const features = me?.features ?? [];

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
    refetch,
  };
}
