import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * リール一覧取得 (GET)
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

  const reels = await prisma.reel.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ reels });
}

/**
 * リール新規作成 (POST)
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
  const { name, maker, size, spoolDepth, gearRatio, weight, spoolVariations } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'リール名は必須です。' }, { status: 400 });
  }

  const reel = await prisma.reel.create({
    data: {
      userId: user.id,
      name: name.trim(),
      maker: maker?.trim() || null,
      size: size?.trim() || null,
      spoolDepth: spoolDepth?.trim() || null,
      gearRatio: gearRatio?.trim() || null,
      weight: weight ? parseInt(weight, 10) : null,
      spoolVariations: spoolVariations?.trim() || null,
    },
  });

  return NextResponse.json({ reel }, { status: 201 });
}
