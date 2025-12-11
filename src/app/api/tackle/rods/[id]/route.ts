import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ロッド更新 (PUT)
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

  // 所有権確認
  const existing = await prisma.rod.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ロッドが見つかりません。' }, { status: 404 });
  }

  const body = await request.json();
  const {
    name,
    maker,
    lengthFt,
    power,
    lureWeightMin,
    lureWeightMax,
    egiSizeMin,
    egiSizeMax,
    lineMin,
    lineMax,
    memo,
  } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'ロッド名は必須です。' }, { status: 400 });
  }

  const rod = await prisma.rod.update({
    where: { id },
    data: {
      name: name.trim(),
      maker: maker?.trim() || null,
      lengthFt: lengthFt?.trim() || null,
      power: power?.trim() || null,
      lureWeightMin: lureWeightMin ? parseFloat(lureWeightMin) : null,
      lureWeightMax: lureWeightMax ? parseFloat(lureWeightMax) : null,
      egiSizeMin: egiSizeMin?.trim() || null,
      egiSizeMax: egiSizeMax?.trim() || null,
      lineMin: lineMin?.trim() || null,
      lineMax: lineMax?.trim() || null,
      memo: memo?.trim() || null,
    },
  });

  return NextResponse.json({ rod });
}

/**
 * ロッド削除 (DELETE)
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

  // 所有権確認
  const existing = await prisma.rod.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ロッドが見つかりません。' }, { status: 404 });
  }

  await prisma.rod.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
