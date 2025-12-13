import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/getCurrentUser';
import { hasFeature, FeatureKey } from './features';
import { planForbidden } from './errors';

/**
 * 特定のfeatureを持つユーザーを取得（未認証or権限不足なら例外でレスポンスを返す）
 * @param featureKey 必要なfeature
 * @throws 401レスポンス（未認証時）
 * @throws 403レスポンス（権限不足時）
 */
export async function requireFeature(featureKey: FeatureKey) {
  const { user } = await requireUser();

  if (!hasFeature(user.plan, featureKey)) {
    // 403 Forbiddenを返す
    // Route Handlerのtry-catchで捕捉され、そのままレスポンスとして返されることを想定
    throw NextResponse.json({ error: planForbidden(featureKey) }, { status: 403 });
  }

  return { user };
}
