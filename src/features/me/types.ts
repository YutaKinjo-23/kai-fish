import type { FeatureKey, Plan } from '@/lib/plan/features';

export type MeResponse = {
  id: string;
  plan: Plan;
  features: FeatureKey[];
};
