import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * タックルセット一覧取得 (GET)
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

  const tackleSets = await prisma.tackleSet.findMany({
    where: { userId: user.id },
    include: {
      rod: true,
      reel: true,
      mainLine: true,
      leader: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tackleSets });
}

/**
 * タックルセット新規作成 (POST)
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
    purpose,
    rodId,
    reelId,
    mainLineId,
    leaderId,
    leaderLb,
    leaderLength,
    rigs,
    targets,
  } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'セット名は必須です。' }, { status: 400 });
  }

  // ロッド・リール・ラインの所有権確認
  if (rodId) {
    const rod = await prisma.rod.findFirst({ where: { id: rodId, userId: user.id } });
    if (!rod) {
      return NextResponse.json({ error: '指定されたロッドが見つかりません。' }, { status: 400 });
    }
  }

  if (reelId) {
    const reel = await prisma.reel.findFirst({ where: { id: reelId, userId: user.id } });
    if (!reel) {
      return NextResponse.json({ error: '指定されたリールが見つかりません。' }, { status: 400 });
    }
  }

  if (mainLineId) {
    const line = await prisma.line.findFirst({ where: { id: mainLineId, userId: user.id } });
    if (!line) {
      return NextResponse.json({ error: '指定されたラインが見つかりません。' }, { status: 400 });
    }
  }

  if (leaderId) {
    const leader = await prisma.line.findFirst({ where: { id: leaderId, userId: user.id } });
    if (!leader) {
      return NextResponse.json({ error: '指定されたリーダーが見つかりません。' }, { status: 400 });
    }
  }

  const tackleSet = await prisma.tackleSet.create({
    data: {
      userId: user.id,
      name: name.trim(),
      purpose: purpose?.trim() || null,
      rodId: rodId || null,
      reelId: reelId || null,
      mainLineId: mainLineId || null,
      leaderId: leaderId || null,
      leaderLb: leaderLb?.trim() || null,
      leaderLength: leaderLength?.trim() || null,
      rigs: Array.isArray(rigs) ? rigs.join(',') : null,
      targets: Array.isArray(targets) ? targets.join(',') : null,
    },
    include: {
      rod: true,
      reel: true,
      mainLine: true,
      leader: true,
    },
  });

  return NextResponse.json({ tackleSet }, { status: 201 });
}
