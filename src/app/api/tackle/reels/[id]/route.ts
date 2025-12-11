import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * リール更新 (PUT)
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

  const existing = await prisma.reel.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'リールが見つかりません。' }, { status: 404 });
  }

  const body = await request.json();
  const { name, maker, size, spoolDepth, gearRatio, weight, spoolVariations } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'リール名は必須です。' }, { status: 400 });
  }

  const reel = await prisma.reel.update({
    where: { id },
    data: {
      name: name.trim(),
      maker: maker?.trim() || null,
      size: size?.trim() || null,
      spoolDepth: spoolDepth?.trim() || null,
      gearRatio: gearRatio?.trim() || null,
      weight: weight ? parseInt(weight, 10) : null,
      spoolVariations: spoolVariations?.trim() || null,
    },
  });

  return NextResponse.json({ reel });
}

/**
 * リール削除 (DELETE)
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

  const existing = await prisma.reel.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'リールが見つかりません。' }, { status: 404 });
  }

  await prisma.reel.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
