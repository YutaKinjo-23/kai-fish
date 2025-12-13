import { z } from 'zod';

/** プラン型 */
export type Plan = 'free' | 'pro';

/** プラン更新リクエストのスキーマ */
export const updatePlanSchema = z.object({
  plan: z.enum(['free', 'pro']),
  reason: z.string().optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

/** 管理者メールアドレスのリスト（環境変数から取得） */
export function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    return [];
  }
  return adminEmailsEnv.split(',').map((email) => email.trim().toLowerCase());
}

/** 指定されたメールアドレスが管理者かどうか判定 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}
