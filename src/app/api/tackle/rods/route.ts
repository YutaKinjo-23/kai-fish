import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * ロッド一覧取得 (GET)
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

  const rods = await prisma.rod.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ rods });
}

/**
 * ロッド新規作成 (POST)
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

  const rod = await prisma.rod.create({
    data: {
      userId: user.id,
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

  return NextResponse.json({ rod }, { status: 201 });
}
