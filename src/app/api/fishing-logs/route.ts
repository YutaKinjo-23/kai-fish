import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';
import type {
  FishingLogSummary,
  FishingLogFilter,
  FishingLogSort,
  FishingLogSortKey,
  SortOrder,
  FishingEvent,
} from '@/types/fishing-log';

/**
 * 釣行記録一覧取得 (GET)
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

  // クエリパラメータからフィルタ・ソート条件を取得
  const { searchParams } = new URL(request.url);
  const filter: FishingLogFilter = {
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    area: searchParams.get('area') || undefined,
    spot: searchParams.get('spot') || undefined,
    mainTarget: searchParams.get('mainTarget') || undefined,
  };

  const sortKey = (searchParams.get('sortKey') || 'date') as FishingLogSortKey;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortOrder;
  const sort: FishingLogSort = { key: sortKey, order: sortOrder };

  // Prismaクエリ条件を構築
  const where: {
    userId: string;
    date?: { gte?: Date; lte?: Date };
  } = {
    userId: user.id,
  };

  if (filter.dateFrom || filter.dateTo) {
    where.date = {};
    if (filter.dateFrom) {
      where.date.gte = new Date(filter.dateFrom);
    }
    if (filter.dateTo) {
      where.date.lte = new Date(filter.dateTo);
    }
  }

  // 釣行記録を取得（イベントも含む）
  const logs = await prisma.fishingLog.findMany({
    where,
    include: {
      events: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: sort.key === 'date' ? { date: sort.order } : { date: 'desc' },
  });

  // サマリ形式に変換
  let summaries: FishingLogSummary[] = logs
    .map((log) => {
      // イベントから情報を抽出
      const startEvent = log.events.find((e) => e.type === 'start');
      const endEvent = log.events.find((e) => e.type === 'end');
      const firstSpotEvent = log.events.find((e) => e.type === 'spot');
      const firstSetupEvent = log.events.find((e) => e.type === 'setup');
      const catchEvents = log.events.filter((e) => e.type === 'catch');

      // 釣果集計
      const totalCatch = catchEvents.length;
      const sizes = catchEvents.map((c) => c.sizeCm).filter((s): s is number => s !== null);
      const maxSize = sizes.length > 0 ? Math.max(...sizes) : null;

      // フィルタ用チェック
      if (filter.area && firstSpotEvent?.area !== filter.area) {
        return null;
      }
      if (filter.spot && firstSpotEvent?.spotName !== filter.spot) {
        return null;
      }
      if (filter.mainTarget && firstSetupEvent?.target !== filter.mainTarget) {
        return null;
      }

      return {
        id: log.id,
        date: log.date.toISOString().split('T')[0],
        spotName: firstSpotEvent?.spotName || null,
        area: firstSpotEvent?.area || null,
        startTime: startEvent?.time || null,
        endTime: endEvent?.time || null,
        mainTarget: firstSetupEvent?.target || null,
        tackleSetName: firstSetupEvent?.tackle || null,
        totalCatch,
        maxSize,
        hasMemo: !!log.memo,
      };
    })
    .filter((s): s is FishingLogSummary => s !== null);

  // 釣果数・サイズでソートする場合
  if (sort.key === 'totalCatch') {
    summaries.sort((a, b) =>
      sort.order === 'desc' ? b.totalCatch - a.totalCatch : a.totalCatch - b.totalCatch
    );
  } else if (sort.key === 'maxSize') {
    summaries.sort((a, b) => {
      const sizeA = a.maxSize ?? 0;
      const sizeB = b.maxSize ?? 0;
      return sort.order === 'desc' ? sizeB - sizeA : sizeA - sizeB;
    });
  }

  return NextResponse.json({ logs: summaries });
}

/**
 * 釣行記録作成 (POST)
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

  // バリデーション
  if (!body.date) {
    return NextResponse.json({ error: '日付は必須です。' }, { status: 400 });
  }

  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: 'イベントは1つ以上必要です。' }, { status: 400 });
  }

  // 釣行記録を作成
  const log = await prisma.fishingLog.create({
    data: {
      userId: user.id,
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
