import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 小物更新 (PUT)
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

  const existing = await prisma.terminalTackle.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: '小物が見つかりません。' }, { status: 404 });
  }

  const body = await request.json();
  const { category, maker, name, size, weight, stockQty, needRestock, memo } = body;

  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'カテゴリは必須です。' }, { status: 400 });
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
  }

  const terminalTackle = await prisma.terminalTackle.update({
    where: { id },
    data: {
      category: category.trim(),
      maker: maker?.trim() || null,
      name: name.trim(),
      size: size?.trim() || null,
      weight: weight?.trim() || null,
      stockQty: stockQty ? parseInt(stockQty, 10) : null,
      needRestock: needRestock || false,
      memo: memo?.trim() || null,
    },
  });

  return NextResponse.json({ terminalTackle });
}

/**
 * 小物削除 (DELETE)
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

  const existing = await prisma.terminalTackle.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: '小物が見つかりません。' }, { status: 404 });
  }

  await prisma.terminalTackle.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
