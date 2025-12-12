'use client';

import { useCallback } from 'react';
import { usePlanGateModal } from '@/features/plan/PlanGateModalContext';
import { PlanForbiddenError } from '@/lib/api/client';
import { isPlanForbiddenError } from '@/lib/features/errors';
import { FeatureKey } from '@/lib/features/features';

export function usePlanGuard() {
  // 既存のモーダル制御フックを使用
  // まだ実装されていない場合は、ここで仮実装するか、TODOコメントを残す
  const { open } = usePlanGateModal();

  /**
   * 403 Forbidden (Plan limitation) をハンドリングしてPro誘導モーダルを開く
   * @param error APIエラーオブジェクト or Response or unknown
   * @param featureKey 明示的に指定する場合
   * @returns モーダルを開いた場合はtrue
   */
  const handlePlanForbidden = useCallback(
    (error: unknown, featureKey?: FeatureKey): boolean => {
      // 1. 明示的なFeatureKey指定がある場合
      if (featureKey) {
        open({ featureKey });
        return true;
      }

      // 2. PlanForbiddenErrorインスタンスの場合 (lib/api/client経由)
      if (error instanceof PlanForbiddenError && error.featureKey) {
        open({ featureKey: error.featureKey as FeatureKey });
        return true;
      }

      // 3. 生のエラーオブジェクトの場合
      // { code: 'PLAN_FORBIDDEN', featureKey: ... }
      if (isPlanForbiddenError(error)) {
        open({ featureKey: error.featureKey });
        return true;
      }

      // 4. Responseオブジェクトの場合 (fetchの戻り値など)
      // ここでは同期的に判定できないため、呼び出し側でjson()パース後に渡すことを想定
      // もしResponseを渡されたら、status 403チェックだけしてデフォルトのモーダルを出す手もあるが
      // featureKeyが特定できないので、基本はパース後のエラーを渡してもらう

      return false;
    },
    [open]
  );

  return { handlePlanForbidden };
}
