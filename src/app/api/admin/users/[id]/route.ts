import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin/auth';
import { unauthorized, jsonError } from '@/lib/api/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/[id]
 * ユーザー詳細を取得（管理者のみ）
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id: userId } = await context.params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return unauthorized();
  }

  // 管理者チェック
  if (!isAdminEmail(currentUser.email)) {
    return jsonError({ code: 'FORBIDDEN', message: 'Admin access required' }, 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      plan: true,
      subscriptionId: true,
      createdAt: true,
      planHistories: {
        select: {
          id: true,
          fromPlan: true,
          toPlan: true,
          reason: true,
          changedByUserId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    return jsonError({ code: 'NOT_FOUND', message: 'User not found' }, 404);
  }

  return NextResponse.json({ user });
}
