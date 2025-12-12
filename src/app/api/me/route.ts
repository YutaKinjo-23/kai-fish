import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { getEnabledFeatures } from '@/lib/plan/features';
import { unauthorized } from '@/lib/api/errors';

/**
 * GET /api/me
 * ログインユーザーのplan情報とenabledFeaturesを返す
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const features = getEnabledFeatures(user.plan);

  return NextResponse.json({
    id: user.id,
    plan: user.plan,
    features: [...features], // readonly配列を通常の配列に変換
  });
}
