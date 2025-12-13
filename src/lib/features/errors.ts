import { FeatureKey } from './features';

export const PLAN_FORBIDDEN_CODE = 'PLAN_FORBIDDEN' as const;

/**
 * 403 Forbidden (Plan limitation) エラーボディ
 */
export type PlanForbiddenError = {
  code: typeof PLAN_FORBIDDEN_CODE;
  featureKey: FeatureKey;
  message?: string;
};

/**
 * エラーオブジェクトがPlanForbiddenErrorか判定する型ガード
 */
export function isPlanForbiddenError(x: unknown): x is PlanForbiddenError {
  if (typeof x !== 'object' || x === null) {
    return false;
  }
  const obj = x as Record<string, unknown>;
  return obj.code === PLAN_FORBIDDEN_CODE && typeof obj.featureKey === 'string';
}

/**
 * PlanForbiddenErrorオブジェクトを生成するファクトリ
 */
export function planForbidden(featureKey: FeatureKey): PlanForbiddenError {
  return {
    code: PLAN_FORBIDDEN_CODE,
    featureKey,
    message: `Plan forbidden: requires ${featureKey}`,
  };
}
