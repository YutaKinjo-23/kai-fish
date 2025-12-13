import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin/auth';
import { unauthorized, jsonError } from '@/lib/api/errors';

/**
 * GET /api/admin/users
 * ユーザー一覧を取得（管理者のみ）
 */
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return unauthorized();
  }

  // 管理者チェック
  if (!isAdminEmail(currentUser.email)) {
    return jsonError({ code: 'FORBIDDEN', message: 'Admin access required' }, 403);
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      plan: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}
