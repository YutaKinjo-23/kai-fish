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
        select: {
          id: true,
          type: true,
          time: true,
          order: true,
          area: true,
          spotName: true,
          tackleSetId: true,
          targetSpeciesIds: true,
          lureId: true,
          color: true,
          rigType: true,
          rigWeight: true,
          speciesId: true,
          sizeCm: true,
          photoUrl: true,
          createdAt: true,
        },
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
        tackleSetId: e.tackleSetId,
        targetSpeciesIds: e.targetSpeciesIds,
        lureId: e.lureId,
        color: e.color,
        rigType: e.rigType,
        rigWeight: e.rigWeight,
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

  const events: FishingEvent[] = body.events;

  // 釣果/使用イベントの lureId 所有権チェック（指定がある場合のみ）
  const rawLureIds = events
    .filter((e: FishingEvent) => e.type === 'catch' || e.type === 'use')
    .map((e: FishingEvent) => (e.type === 'catch' || e.type === 'use' ? e.lureId : null))
    .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
    .map((id) => id.trim());
  const lureIds = [...new Set(rawLureIds)];

  if (lureIds.length > 0) {
    const owned = await prisma.lure.findMany({
      where: { userId: user.id, id: { in: lureIds } },
      select: { id: true },
    });
    if (owned.length !== lureIds.length) {
      return NextResponse.json({ error: '指定されたルアーが見つかりません。' }, { status: 400 });
    }
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
          create: events.map((e: FishingEvent, index: number) => ({
            type: e.type,
            time: e.time,
            order: e.order ?? index,
            area: e.type === 'spot' ? e.area : null,
            spotName: e.type === 'spot' ? e.spotName : null,
            tackleSetId:
              e.type === 'setup' &&
              typeof e.tackleSetId === 'string' &&
              e.tackleSetId.trim().length > 0
                ? e.tackleSetId.trim()
                : null,
            targetSpeciesIds:
              e.type === 'setup' && Array.isArray(e.targetSpeciesIds) ? e.targetSpeciesIds : [],
            lureId:
              (e.type === 'catch' || e.type === 'use') &&
              typeof e.lureId === 'string' &&
              e.lureId.trim().length > 0
                ? e.lureId.trim()
                : null,
            color:
              e.type === 'use' && typeof e.color === 'string' && e.color.trim().length > 0
                ? e.color.trim()
                : null,
            rigType:
              e.type === 'use' &&
              e.rig &&
              typeof e.rig.type === 'string' &&
              e.rig.type.trim().length > 0
                ? e.rig.type.trim()
                : null,
            rigWeight:
              e.type === 'use' && e.rig && typeof e.rig.weight === 'number' ? e.rig.weight : null,
            speciesId: e.type === 'catch' ? e.speciesId : null,
            sizeCm: e.type === 'catch' ? e.sizeCm : null,
            photoUrl: e.type === 'catch' ? e.photoUrl : null,
          })),
        },
      },
      include: {
        events: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            time: true,
            order: true,
            area: true,
            spotName: true,
            tackleSetId: true,
            targetSpeciesIds: true,
            lureId: true,
            color: true,
            rigType: true,
            rigWeight: true,
            speciesId: true,
            sizeCm: true,
            photoUrl: true,
            createdAt: true,
          },
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
        tackleSetId: e.tackleSetId,
        targetSpeciesIds: e.targetSpeciesIds,
        lureId: e.lureId,
        color: e.color,
        rigType: e.rigType,
        rigWeight: e.rigWeight,
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
