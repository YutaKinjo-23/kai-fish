import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * 小物一覧取得 (GET)
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

  const terminalTackles = await prisma.terminalTackle.findMany({
    where: { userId: user.id },
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ terminalTackles });
}

/**
 * 小物新規作成 (POST)
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
  const { category, maker, name, size, weight, stockQty, needRestock, memo } = body;

  if (!category || typeof category !== 'string') {
    return NextResponse.json({ error: 'カテゴリは必須です。' }, { status: 400 });
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
  }

  const terminalTackle = await prisma.terminalTackle.create({
    data: {
      userId: user.id,
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

  return NextResponse.json({ terminalTackle }, { status: 201 });
}
