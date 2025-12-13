/**
 * Feature Key方式の課金ガード
 * プランではなくfeatureKeyで判定することで、将来的なPro+等の拡張を容易にする
 */

/** Feature Keyの型（追加はここに追記するだけ） */
export type FeatureKey = 'dashboard.advanced' | 'lures.breakdown' | 'ai.recommend';

/** プラン型 */
export type Plan = 'free' | 'pro';

/** プランごとに有効なFeature Key一覧 */
export const PLAN_FEATURES = {
  free: [] as const satisfies readonly FeatureKey[],
  pro: [
    'dashboard.advanced',
    'lures.breakdown',
    'ai.recommend',
  ] as const satisfies readonly FeatureKey[],
} as const;

/**
 * 指定プランが特定のfeatureを持っているか判定
 */
export function hasFeature(plan: Plan, featureKey: FeatureKey): boolean {
  const features = PLAN_FEATURES[plan];
  return (features as readonly FeatureKey[]).includes(featureKey);
}

/**
 * 指定プランで有効なfeature一覧を取得
 */
export function getEnabledFeatures(plan: Plan): readonly FeatureKey[] {
  return PLAN_FEATURES[plan];
}
