import { NextResponse } from 'next/server';
import type { FeatureKey, Plan } from '@/lib/plan/features';

/**
 * APIエラーレスポンスの共通型
 */
export interface ApiError {
  code: string;
  message?: string;
  required?: Plan;
  feature?: FeatureKey;
}

export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * 成功レスポンスを返す
 */
export function jsonOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * エラーレスポンスを返す
 */
export function jsonError(error: ApiError, status: number): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error }, { status });
}

/**
 * 認証エラー（401）
 */
export function unauthorized(message = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return jsonError({ code: 'UNAUTHORIZED', message }, 401);
}

/**
 * プラン不足エラー（403）
 * FEでcodeを見て課金モーダルを出せるようにする
 */
export function forbiddenFeature(
  featureKey: FeatureKey,
  requiredPlan: Plan = 'pro'
): NextResponse<ApiErrorResponse> {
  return jsonError(
    {
      code: 'PLAN_FORBIDDEN',
      required: requiredPlan,
      feature: featureKey,
    },
    403
  );
}
