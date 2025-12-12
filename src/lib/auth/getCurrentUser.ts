import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';
import type { Plan } from '@/lib/plan/features';

/**
 * 現在のユーザー情報（planを含む）
 */
export interface CurrentUser {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  areas?: string[];
  targets?: string[];
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

  // TODO: Userモデルにplanフィールドを追加後、user.planを使用する
  // 現時点ではDBにplanがないため、全ユーザーを'free'として扱う
  // Prismaスキーマにplanを追加し、マイグレーション後に以下を有効化:
  // plan: user.plan as Plan

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    areas: user.areas,
    targets: user.targets,
    plan: 'free', // 暫定: DBにplan追加後は user.plan を使用
  };
}
