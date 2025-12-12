'use client';

import { type ReactNode } from 'react';
import { useFeatures } from '@/hooks/useFeatures';
import type { FeatureKey } from '@/lib/plan/features';

interface ProGateProps {
  /** 必要なfeature */
  feature: FeatureKey;
  /** featureがある場合に表示する内容 */
  children: ReactNode;
  /** featureがない場合に表示する内容（省略時は何も表示しない） */
  fallback?: ReactNode;
  /** ローディング中に表示する内容（省略時は何も表示しない） */
  loading?: ReactNode;
}

/**
 * Feature Keyに基づいてコンテンツの表示を制御するコンポーネント
 *
 * 使用例:
 * ```tsx
 * <ProGate feature="dashboard.advanced" fallback={<UpgradeButton />}>
 *   <AdvancedDashboard />
 * </ProGate>
 * ```
 *
 * ボタンを表示して押下時に課金モーダルを出すパターン:
 * ```tsx
 * // featureがなくてもボタンは表示し、onClick内で判定してモーダルを出す
 * <Button onClick={() => {
 *   if (!hasFeature('ai.recommend')) {
 *     openUpgradeModal();
 *     return;
 *   }
 *   // 本来の処理
 * }}>
 *   AI推薦
 * </Button>
 * ```
 */
export function ProGate({
  feature,
  children,
  fallback = null,
  loading: loadingContent = null,
}: ProGateProps) {
  const { hasFeature, loading } = useFeatures();

  if (loading) {
    return <>{loadingContent}</>;
  }

  if (!hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
