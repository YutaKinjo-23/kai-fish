import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';
import type { FishingEvent } from '@/types/fishing-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 釣行記録詳細取得 (GET)
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

  const log = await prisma.fishingLog.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!log) {
    return NextResponse.json({ error: '釣行記録が見つかりません。' }, { status: 404 });
  }

  if (log.userId !== user.id) {
    return NextResponse.json({ error: 'アクセス権限がありません。' }, { status: 403 });
  }

  return NextResponse.json({
    log: {
      id: log.id,
      date: log.date.toISOString().split('T')[0],
      memo: log.memo,
      events: log.events.map((e) => ({
        id: e.id,
        type: e.type,
        time: e.time,
        order: e.order,
        area: e.area,
        spotName: e.spotName,
        target: e.target,
        tackle: e.tackle,
        rig: e.rig,
        speciesId: e.speciesId,
        sizeCm: e.sizeCm,
        photoUrl: e.photoUrl,
        createdAt: e.createdAt.toISOString(),
      })),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    },
  });
}

/**
 * 釣行記録更新 (PUT)
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

  const existing = await prisma.fishingLog.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: '釣行記録が見つかりません。' }, { status: 404 });
  }

  if (existing.userId !== user.id) {
    return NextResponse.json({ error: 'アクセス権限がありません。' }, { status: 403 });
  }

  const body = await request.json();

  // バリデーション
  if (!body.date) {
    return NextResponse.json({ error: '日付は必須です。' }, { status: 400 });
  }

  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: 'イベントは1つ以上必要です。' }, { status: 400 });
  }

  // トランザクションで更新
  const log = await prisma.$transaction(async (tx) => {
    // 既存のイベントを削除
    await tx.fishingEvent.deleteMany({
      where: { fishingLogId: id },
    });

    // 釣行記録を更新（新しいイベントを追加）
    return tx.fishingLog.update({
      where: { id },
      data: {
        date: new Date(body.date),
        memo: body.memo || null,
        events: {
          create: body.events.map((e: FishingEvent, index: number) => ({
            type: e.type,
            time: e.time,
            order: e.order ?? index,
            area: e.type === 'spot' ? e.area : null,
            spotName: e.type === 'spot' ? e.spotName : null,
            target: e.type === 'setup' ? e.target : null,
            tackle: e.type === 'setup' ? e.tackle : null,
            rig: e.type === 'setup' ? e.rig : null,
            speciesId: e.type === 'catch' ? e.speciesId : null,
            sizeCm: e.type === 'catch' ? e.sizeCm : null,
            photoUrl: e.type === 'catch' ? e.photoUrl : null,
          })),
        },
      },
      include: {
        events: {
          orderBy: { order: 'asc' },
        },
      },
    });
  });

  return NextResponse.json({
    log: {
      id: log.id,
      date: log.date.toISOString().split('T')[0],
      memo: log.memo,
      events: log.events.map((e) => ({
        id: e.id,
        type: e.type,
        time: e.time,
        order: e.order,
        area: e.area,
        spotName: e.spotName,
        target: e.target,
        tackle: e.tackle,
        rig: e.rig,
        speciesId: e.speciesId,
        sizeCm: e.sizeCm,
        photoUrl: e.photoUrl,
        createdAt: e.createdAt.toISOString(),
      })),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    },
  });
}

/**
 * 釣行記録削除 (DELETE)
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

  const existing = await prisma.fishingLog.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: '釣行記録が見つかりません。' }, { status: 404 });
  }

  if (existing.userId !== user.id) {
    return NextResponse.json({ error: 'アクセス権限がありません。' }, { status: 403 });
  }

  await prisma.fishingLog.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
