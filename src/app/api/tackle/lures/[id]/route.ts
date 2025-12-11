import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ルアー・ワーム更新 (PUT)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });
  }

  const existing = await prisma.lure.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ルアーが見つかりません。' }, { status: 404 });
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

  const lure = await prisma.lure.update({
    where: { id },
    data: {
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

  return NextResponse.json({ lure });
}

/**
 * ルアー・ワーム削除 (DELETE)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });
  }

  const existing = await prisma.lure.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ルアーが見つかりません。' }, { status: 404 });
  }

  await prisma.lure.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
