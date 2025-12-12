import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';
import type { Plan } from '@/lib/plan/features';
import { unauthorized } from '@/lib/api/errors';

export interface CurrentUser {
  id: string;
  email: string;
  plan: Plan;
}

/**
 * 現在のセッションからユーザーを取得
 * @returns ユーザー情報（未認証の場合はnull）
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    plan: user.plan,
  };
}

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
