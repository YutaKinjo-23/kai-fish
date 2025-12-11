import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * ライン一覧取得 (GET)
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

  const lines = await prisma.line.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ lines });
}

/**
 * ライン新規作成 (POST)
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
  const { name, lineType, lineRole, maker, thickness, lb, reelId, usageTags } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'ライン名は必須です。' }, { status: 400 });
  }

  if (!lineType || typeof lineType !== 'string') {
    return NextResponse.json({ error: 'ライン種別は必須です。' }, { status: 400 });
  }

  const line = await prisma.line.create({
    data: {
      userId: user.id,
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

  return NextResponse.json({ line }, { status: 201 });
}
