// src/app/api/line/link/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { verifyLineIdToken } from '@/lib/line/verifyIdToken';

/**
 * POST /api/line/link
 * LINEアカウントとKAIユーザーを紐付ける
 *
 * Body: { idToken: string }
 * 認証: 必須（ログイン済みユーザーのみ）
 *
 * セキュリティ:
 * 1. KAI側ログイン済みユーザーのみ紐付け可能
 * 2. IDトークン検証でlineUserIdが本物であることを担保
 */
export async function POST(req: Request) {
  try {
    // 認証チェック（KAI側にログイン済みか）
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    // IDトークン検証（LINE APIで検証し、lineUserIdを取得）
    const verifyResult = await verifyLineIdToken(idToken);

    if (!verifyResult.success) {
      return NextResponse.json({ error: verifyResult.error }, { status: 401 });
    }

    // 検証済みのlineUserIdを使用（クライアントから送られた値は信用しない）
    const lineUserId = verifyResult.payload.sub;

    // 既に他のユーザーに紐付いていないかチェック
    const existingAccount = await prisma.lineAccount.findUnique({
      where: { lineUserId },
      select: { userId: true },
    });

    if (existingAccount && existingAccount.userId !== user.id) {
      return NextResponse.json(
        { error: 'This LINE account is already linked to another user' },
        { status: 409 }
      );
    }

    // upsert: 既存なら更新、なければ作成
    const lineAccount = await prisma.lineAccount.upsert({
      where: { userId: user.id },
      update: { lineUserId },
      create: {
        userId: user.id,
        lineUserId,
      },
    });

    return NextResponse.json({
      success: true,
      lineAccount: {
        id: lineAccount.id,
        lineUserId: lineAccount.lineUserId,
        createdAt: lineAccount.createdAt,
      },
    });
  } catch (error) {
    console.error('[LINE Link] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/line/link
 * 現在のLINE連携状態を取得
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lineAccount = await prisma.lineAccount.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        lineUserId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      linked: !!lineAccount,
      lineAccount: lineAccount ?? null,
    });
  } catch (error) {
    console.error('[LINE Link] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/line/link
 * LINE連携を解除
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await prisma.lineAccount
      .delete({
        where: { userId: user.id },
      })
      .catch(() => null);

    if (!deleted) {
      return NextResponse.json({ error: 'LINE account not linked' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE Link] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
