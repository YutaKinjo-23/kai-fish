import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ルアー・ワーム詳細取得 (GET)
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

  const lure = await prisma.lure.findFirst({
    where: { id, userId: user.id },
  });

  if (!lure) {
    return NextResponse.json({ error: 'ルアーが見つかりません。' }, { status: 404 });
  }

  const grouped = await prisma.fishingEvent.groupBy({
    by: [Prisma.FishingEventScalarFieldEnum.lureId],
    where: {
      type: 'catch',
      lureId: id,
      fishingLog: { userId: user.id },
    },
    _count: { _all: true },
    _avg: { sizeCm: true },
  });

  const hitCount =
    typeof grouped[0]?._count === 'number'
      ? (grouped[0]?._count ?? 0)
      : (grouped[0]?._count?._all ?? 0);
  const avgSizeCm = grouped[0]?._avg?.sizeCm ?? null;

  // 使用回数を計算（ルアーを変えた回数としてカウント）
  // use/catchが連続している間は同一セッションとして扱う
  const logsWithEvents = await prisma.fishingLog.findMany({
    where: {
      userId: user.id,
      events: {
        some: {
          type: { in: ['use', 'catch'] },
          lureId: id,
        },
      },
    },
    include: {
      events: {
        where: {
          OR: [{ type: { in: ['use', 'catch'] } }],
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  let usageCount = 0;
  for (const log of logsWithEvents) {
    let currentLureId: string | null = null;
    for (const event of log.events) {
      if ((event.type === 'use' || event.type === 'catch') && event.lureId) {
        // ルアーが変わった場合のみ新しいセッションとしてカウント
        if (event.lureId !== currentLureId) {
          // 対象ルアーのみカウント
          if (event.lureId === id) {
            usageCount += 1;
          }
          currentLureId = event.lureId;
        }
      }
    }
  }

  // よく使用したリグ（ログから推定）
  const logs = await prisma.fishingLog.findMany({
    where: {
      userId: user.id,
      events: { some: { type: 'catch', lureId: id } },
    },
    include: {
      events: { orderBy: { order: 'asc' } },
    },
  });

  // 新しい構造ではリグ情報はuseイベントに持つため、catchイベントと関連付けが必要
  // ここでは直前のuseイベントのrigTypeを使用する
  const rigCounts = new Map<string, number>();
  logs.forEach((log) => {
    let currentRig: string | null = null;
    log.events.forEach((e) => {
      if (e.type === 'use' && e.lureId === id) {
        currentRig = e.rigType || null;
      }
      if (e.type === 'catch' && e.lureId === id) {
        if (currentRig && currentRig.trim().length > 0) {
          rigCounts.set(currentRig, (rigCounts.get(currentRig) ?? 0) + 1);
        }
      }
    });
  });

  let mostUsedRig: string | null = null;
  let mostUsedRigCount = 0;
  rigCounts.forEach((count, rig) => {
    if (count > mostUsedRigCount) {
      mostUsedRig = rig;
      mostUsedRigCount = count;
    }
  });

  return NextResponse.json({
    lure,
    stats: {
      usageCount,
      hitCount,
      avgSizeCm,
      mostUsedRig,
    },
  });
}

/**
 * ルアー・ワーム更新 (PUT)
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

  const existing = await prisma.lure.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ルアーが見つかりません。' }, { status: 404 });
  }

  const body = await request.json();
  const {
    lureType,
    maker,
    name,
    color,
    size,
    imageUrl,
    recommendedHook,
    recommendedRig,
    recommendedSinkerWeight,
    memo,
    rating,
    conditionMemo,
    rigExamples,
    areas,
    timeZones,
    seasons,
    tides,
    waterQualities,
    waterTempC,
    windDirection,
    windSpeedMs,
    stockQty,
    needRestock,
  } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
  }

  if (!lureType || typeof lureType !== 'string') {
    return NextResponse.json({ error: 'ルアー種別は必須です。' }, { status: 400 });
  }

  const updateData: Prisma.LureUpdateInput = {
    lureType: lureType.trim(),
    maker: maker?.trim() || null,
    name: name.trim(),
    color: color?.trim() || null,
    size: size?.trim() || null,
    recommendedHook: recommendedHook?.trim() || null,
    recommendedRig: Array.isArray(recommendedRig) ? recommendedRig.join(',') : null,
    memo: memo?.trim() || null,
    stockQty: stockQty ? parseInt(stockQty, 10) : null,
    needRestock: needRestock === true,
  };

  if (imageUrl !== undefined) {
    updateData.imageUrl =
      typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl.trim() : null;
  }
  if (recommendedSinkerWeight !== undefined) {
    updateData.recommendedSinkerWeight =
      typeof recommendedSinkerWeight === 'string' && recommendedSinkerWeight.trim().length > 0
        ? recommendedSinkerWeight.trim()
        : null;
  }
  if (rating !== undefined) {
    const parsed =
      typeof rating === 'number' ? rating : typeof rating === 'string' ? parseInt(rating, 10) : NaN;
    updateData.rating = Number.isFinite(parsed) ? Math.min(5, Math.max(1, parsed)) : null;
  }
  if (conditionMemo !== undefined) {
    updateData.conditionMemo =
      typeof conditionMemo === 'string' && conditionMemo.trim().length > 0
        ? conditionMemo.trim()
        : null;
  }
  if (rigExamples !== undefined) {
    updateData.rigExamples = Array.isArray(rigExamples)
      ? rigExamples
          .filter((v: unknown): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [];
  }
  if (areas !== undefined) {
    updateData.areas = Array.isArray(areas)
      ? areas
          .filter((v: unknown): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [];
  }
  if (timeZones !== undefined) {
    updateData.timeZones = Array.isArray(timeZones)
      ? timeZones
          .filter((v: unknown): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [];
  }
  if (seasons !== undefined) {
    updateData.seasons = Array.isArray(seasons)
      ? seasons
          .filter((v: unknown): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [];
  }
  if (tides !== undefined) {
    updateData.tides = Array.isArray(tides)
      ? tides
          .filter((v: unknown): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [];
  }
  if (waterQualities !== undefined) {
    updateData.waterQualities = Array.isArray(waterQualities)
      ? waterQualities
          .filter((v: unknown): v is string => typeof v === 'string')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : [];
  }
  if (waterTempC !== undefined) {
    const parsed =
      typeof waterTempC === 'number'
        ? waterTempC
        : typeof waterTempC === 'string'
          ? parseFloat(waterTempC)
          : NaN;
    updateData.waterTempC = Number.isFinite(parsed) ? parsed : null;
  }
  if (windDirection !== undefined) {
    updateData.windDirection =
      typeof windDirection === 'string' && windDirection.trim().length > 0
        ? windDirection.trim()
        : null;
  }
  if (windSpeedMs !== undefined) {
    const parsed =
      typeof windSpeedMs === 'number'
        ? windSpeedMs
        : typeof windSpeedMs === 'string'
          ? parseFloat(windSpeedMs)
          : NaN;
    updateData.windSpeedMs = Number.isFinite(parsed) ? parsed : null;
  }

  const lure = await prisma.lure.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ lure });
}

/**
 * ルアー・ワーム削除 (DELETE)
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

  const existing = await prisma.lure.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'ルアーが見つかりません。' }, { status: 404 });
  }

  await prisma.lure.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
