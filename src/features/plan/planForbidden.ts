export const PLAN_FORBIDDEN_CODE = 'PLAN_FORBIDDEN' as const;

export type PlanForbiddenErrorBody = {
  code: typeof PLAN_FORBIDDEN_CODE;
  featureKey?: string;
  message?: string;
};

export function isPlanForbiddenBody(v: unknown): v is PlanForbiddenErrorBody {
  if (typeof v !== 'object' || v === null) {
    return false;
  }
  const obj = v as Record<string, unknown>;
  return obj.code === PLAN_FORBIDDEN_CODE;
}
