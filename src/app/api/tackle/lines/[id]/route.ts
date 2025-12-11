import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ライン更新 (PUT)
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

  const existing = await prisma.line.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ラインが見つかりません。' }, { status: 404 });
  }

  const body = await request.json();
  const { name, lineType, lineRole, maker, thickness, lb, reelId, usageTags } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'ライン名は必須です。' }, { status: 400 });
  }

  if (!lineType || typeof lineType !== 'string') {
    return NextResponse.json({ error: 'ライン種別は必須です。' }, { status: 400 });
  }

  const line = await prisma.line.update({
    where: { id },
    data: {
      name: name.trim(),
      lineType: lineType.trim(),
      lineRole: lineRole?.trim() || null,
      maker: maker?.trim() || null,
      thickness: thickness?.trim() || null,
      lb: lb?.trim() || null,
      reelId: reelId || null,
      usageTags: Array.isArray(usageTags) ? usageTags.join(',') : null,
    },
  });

  return NextResponse.json({ line });
}

/**
 * ライン削除 (DELETE)
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

  const existing = await prisma.line.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ラインが見つかりません。' }, { status: 404 });
  }

  await prisma.line.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
