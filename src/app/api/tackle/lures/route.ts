import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * ルアー・ワーム一覧取得 (GET)
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const area = searchParams.get('area') || '';
  const spot = searchParams.get('spot') || '';
  const timeZone = searchParams.get('timeZone') || '';
  const season = searchParams.get('season') || '';
  const tide = searchParams.get('tide') || '';
  const waterQuality = searchParams.get('waterQuality') || '';
  const includeStats = searchParams.get('includeStats') === '1';

  // エリアまたはスポットでフィルタする場合、タイムラインを考慮してルアーIDを取得
  let lureIdsFromLogs: string[] | null = null;
  if (area.trim().length > 0 || spot.trim().length > 0) {
    // 該当エリア/スポットを含む釣行記録を取得（全イベント含む）
    const logsWithEvents = await prisma.fishingLog.findMany({
      where: {
        userId: user.id,
        events: {
          some: {
            type: 'spot',
            ...(area.trim().length > 0 && { area: { contains: area.trim(), mode: 'insensitive' } }),
            ...(spot.trim().length > 0 && {
              spotName: { contains: spot.trim(), mode: 'insensitive' },
            }),
          },
        },
      },
      include: {
        events: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (logsWithEvents.length === 0) {
      return NextResponse.json({ lures: [] });
    }

    // タイムラインを解析して、該当スポットの後に使用されたルアーIDを収集
    const lureIdSet = new Set<string>();
    const areaLower = area.trim().toLowerCase();
    const spotLower = spot.trim().toLowerCase();

    for (const log of logsWithEvents) {
      let isInTargetSpot = false;

      for (const event of log.events) {
        if (event.type === 'spot') {
          // スポットイベントに来たら、フィルター条件に合うかチェック
          const eventArea = (event.area || '').toLowerCase();
          const eventSpotName = (event.spotName || '').toLowerCase();

          const areaMatches = areaLower.length === 0 || eventArea.includes(areaLower);
          const spotMatches = spotLower.length === 0 || eventSpotName.includes(spotLower);

          isInTargetSpot = areaMatches && spotMatches;
        } else if ((event.type === 'use' || event.type === 'catch') && isInTargetSpot) {
          // 対象スポット内でのルアー使用/釣果イベント
          if (event.lureId) {
            lureIdSet.add(event.lureId);
          }
        }
      }
    }

    lureIdsFromLogs = Array.from(lureIdSet);

    if (lureIdsFromLogs.length === 0) {
      return NextResponse.json({ lures: [] });
    }
  }

  const where: Prisma.LureWhereInput = {
    userId: user.id,
    ...(lureIdsFromLogs && { id: { in: lureIdsFromLogs } }),
  };

  if (q.trim().length > 0) {
    where.OR = [
      { name: { contains: q.trim(), mode: 'insensitive' } },
      { maker: { contains: q.trim(), mode: 'insensitive' } },
      { color: { contains: q.trim(), mode: 'insensitive' } },
    ];
  }

  if (timeZone.trim().length > 0) {
    where.timeZones = { has: timeZone.trim() };
  }
  if (season.trim().length > 0) {
    where.seasons = { has: season.trim() };
  }
  if (tide.trim().length > 0) {
    where.tides = { has: tide.trim() };
  }
  if (waterQuality.trim().length > 0) {
    where.waterQualities = { has: waterQuality.trim() };
  }

  const lures = await prisma.lure.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  if (!includeStats || lures.length === 0) {
    return NextResponse.json({ lures });
  }

  const lureIds = lures.map((l) => l.id);
  const grouped = await prisma.fishingEvent.groupBy({
    by: [Prisma.FishingEventScalarFieldEnum.lureId],
    where: {
      type: 'catch',
      lureId: { in: lureIds },
      fishingLog: { userId: user.id },
    },
    _count: { _all: true },
    _avg: { sizeCm: true },
  });

  const statsMap = new Map<string, { hitCount: number; avgSizeCm: number | null }>();
  grouped.forEach((g) => {
    if (!g.lureId) return;
    const hitCount = typeof g._count === 'number' ? g._count : (g._count?._all ?? 0);
    const avgSizeCm = g._avg?.sizeCm ?? null;
    statsMap.set(g.lureId, { hitCount, avgSizeCm });
  });

  // 使用回数を計算（ルアーを変えた回数としてカウント）
  // use/catchが連続している間は同一セッションとして扱う
  const usageCountMap = new Map<string, number>();

  const logsWithEvents = await prisma.fishingLog.findMany({
    where: {
      userId: user.id,
      events: {
        some: {
          type: { in: ['use', 'catch'] },
          lureId: { in: lureIds },
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

  for (const log of logsWithEvents) {
    let currentLureId: string | null = null;
    for (const event of log.events) {
      if ((event.type === 'use' || event.type === 'catch') && event.lureId) {
        // ルアーが変わった場合のみ新しいセッションとしてカウント
        if (event.lureId !== currentLureId) {
          // 対象ルアーのみカウント
          if (lureIds.includes(event.lureId)) {
            usageCountMap.set(event.lureId, (usageCountMap.get(event.lureId) ?? 0) + 1);
          }
          currentLureId = event.lureId;
        }
      }
    }
  }

  const luresWithStats = lures.map((l) => {
    const stats = statsMap.get(l.id);
    const usageCount = usageCountMap.get(l.id);
    return {
      ...l,
      hitCount: stats?.hitCount ?? 0,
      avgSizeCm: stats?.avgSizeCm ?? null,
      usageCount: usageCount ?? 0,
    };
  });

  return NextResponse.json({ lures: luresWithStats });
}

/**
 * ルアー・ワーム新規作成 (POST)
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
    lureType,
    maker,
    name,
    color,
    size,
    recommendedHook,
    recommendedRig,
    memo,
    stockQty,
    needRestock,
  } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
  }

  if (!lureType || typeof lureType !== 'string') {
    return NextResponse.json({ error: 'ルアー種別は必須です。' }, { status: 400 });
  }

  const lure = await prisma.lure.create({
    data: {
      userId: user.id,
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
    },
  });

  return NextResponse.json({ lure }, { status: 201 });
}
