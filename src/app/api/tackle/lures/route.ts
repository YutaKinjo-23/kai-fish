import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * ルアー・ワーム一覧取得 (GET)
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });
  }

  const lures = await prisma.lure.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ lures });
}

/**
 * ルアー・ワーム新規作成 (POST)
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });
  }

  const body = await request.json();
  const {
    lureType,
    maker,
    name,
    color,
    size,
    recommendedHook,
    recommendedRig,
    memo,
    stockQty,
    needRestock,
  } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
  }

  if (!lureType || typeof lureType !== 'string') {
    return NextResponse.json({ error: 'ルアー種別は必須です。' }, { status: 400 });
  }

  const lure = await prisma.lure.create({
    data: {
      userId: user.id,
      lureType: lureType.trim(),
      maker: maker?.trim() || null,
      name: name.trim(),
      color: color?.trim() || null,
      size: size?.trim() || null,
      recommendedHook: recommendedHook?.trim() || null,
      recommendedRig: Array.isArray(recommendedRig) ? recommendedRig.join(',') : null,
      memo: memo?.trim() || null,
      stockQty: stockQty ? parseInt(stockQty, 10) : null,
      needRestock: needRestock === true,
    },
  });

  return NextResponse.json({ lure }, { status: 201 });
}
