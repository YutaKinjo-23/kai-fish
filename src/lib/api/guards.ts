import { getCurrentUser, type CurrentUser } from '@/lib/auth/getCurrentUser';
import { hasFeature, type FeatureKey } from '@/lib/plan/features';
import { unauthorized, forbiddenFeature } from '@/lib/api/errors';

/**
 * 認証済みユーザーを取得（未認証なら例外でレスポンスを返す）
 * @throws 401レスポンス（未認証時）
 */
export async function requireUser(): Promise<{ user: CurrentUser }> {
  const user = await getCurrentUser();

  if (!user) {
    throw unauthorized();
  }

  return { user };
}

/**
 * 特定のfeatureを持つユーザーを取得（未認証or権限不足なら例外でレスポンスを返す）
 * @param featureKey 必要なfeature
 * @throws 401レスポンス（未認証時）
 * @throws 403レスポンス（権限不足時）
 */
export async function requireFeature(featureKey: FeatureKey): Promise<{ user: CurrentUser }> {
  const { user } = await requireUser();

  if (!hasFeature(user.plan, featureKey)) {
    throw forbiddenFeature(featureKey);
  }

  return { user };
}
