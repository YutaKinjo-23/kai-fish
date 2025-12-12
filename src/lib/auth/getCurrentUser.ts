import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';
import type { Plan } from '@/lib/plan/features';

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
