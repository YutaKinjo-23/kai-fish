import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { prisma } from '@/lib/prisma';
import { isAdminEmail, updatePlanSchema } from '@/lib/admin/auth';
import { unauthorized, jsonError } from '@/lib/api/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/users/[id]/plan
 * ユーザーのプランを変更する（管理者のみ）
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: targetUserId } = await context.params;

  // 実行者を取得
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return unauthorized();
  }

  // 管理者チェック
  if (!isAdminEmail(currentUser.email)) {
    return jsonError({ code: 'FORBIDDEN', message: 'Admin access required' }, 403);
  }

  // リクエストボディを解析
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError({ code: 'INVALID_JSON', message: 'Invalid JSON body' }, 400);
  }

  // バリデーション
  const result = updatePlanSchema.safeParse(body);
  if (!result.success) {
    return jsonError(
      { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message || 'Invalid input' },
      400
    );
  }

  const { plan: newPlan, reason } = result.data;

  // 対象ユーザーを取得
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, plan: true },
  });

  if (!targetUser) {
    return jsonError({ code: 'NOT_FOUND', message: 'User not found' }, 404);
  }

  const fromPlan = targetUser.plan;

  // 同じプランなら何もしない
  if (fromPlan === newPlan) {
    return NextResponse.json({
      id: targetUser.id,
      email: targetUser.email,
      plan: newPlan,
      message: 'Plan unchanged',
    });
  }

  // トランザクションでプラン更新とPlanHistory追加を実行
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { plan: newPlan },
      select: { id: true, email: true, plan: true },
    }),
    prisma.planHistory.create({
      data: {
        userId: targetUserId,
        fromPlan,
        toPlan: newPlan,
        reason: reason || null,
        changedByUserId: currentUser.id,
      },
    }),
  ]);

  return NextResponse.json({
    id: updatedUser.id,
    email: updatedUser.email,
    plan: updatedUser.plan,
  });
}
