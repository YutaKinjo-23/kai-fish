import { useCallback } from 'react';
import type { FeatureKey } from '@/lib/plan/features';
import { useMe } from './useMe';

export function useFeatures() {
  const { me } = useMe();
  const features = me?.features ?? [];

  const hasFeature = useCallback(
    (featureKey: FeatureKey): boolean => {
      return features.includes(featureKey);
    },
    [features]
  );

  return { hasFeature, features };
}
