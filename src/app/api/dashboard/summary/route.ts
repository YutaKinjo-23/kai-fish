import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/api/guards';
import type { DashboardOverview, TopAreaItem, TopLureItem } from '@/types/dashboard';

// 今月の範囲を取得
function getThisMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from, to };
}

// ラベル生成
function buildLureLabel(
  lure: { name: string; color: string | null } | null,
  fallback: string
): string {
  if (!lure) return fallback;
  if (lure.color) {
    return `${lure.name}(${lure.color})`;
  }
  return lure.name;
}

type DashboardSummaryResponse = {
  overview: DashboardOverview;
  topAreas: TopAreaItem[];
  topLures: TopLureItem[];
  lureHitsTop: TopLureItem[];
};

type EventRow = {
  type: string;
  order: number;
  area: string | null;
  lureId: string | null;
  lure: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  sizeCm: number | null;
};

export async function GET() {
  try {
    const { user } = await requireUser();
    const { from: monthFrom, to: monthTo } = getThisMonthRange();

    // ===== 今月データ用クエリ =====
    const monthLogs = await prisma.fishingLog.findMany({
      where: {
        userId: user.id,
        date: { gte: monthFrom, lte: monthTo },
      },
      include: {
        events: {
          where: { type: 'catch' },
          orderBy: { order: 'asc' },
        },
      },
    });

    // ===== 直近10回データ =====
    const recentLogs = await prisma.fishingLog.findMany({
      where: { userId: user.id },
      include: {
        events: {
          where: { type: 'catch' },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    // ===== 概要カード集計 =====
    let recentAvgHits: number | null = null;
    let recentMaxSize: number | null = null;

    if (recentLogs.length > 0) {
      const hitCounts = recentLogs.map((log) => log.events.length);
      recentAvgHits = hitCounts.reduce((a, b) => a + b, 0) / hitCounts.length;

      const sizes = recentLogs
        .flatMap((log) => log.events)
        .map((e) => e.sizeCm)
        .filter((s): s is number => s !== null && s > 0);
      if (sizes.length > 0) {
        recentMaxSize = Math.max(...sizes);
      }
    }

    const monthTripCount = monthLogs.length;
    const monthTotalHits = monthLogs.reduce((sum, log) => sum + log.events.length, 0);

    const overview: DashboardOverview = {
      recentAvgHits: recentAvgHits !== null ? Math.round(recentAvgHits * 10) / 10 : null,
      recentMaxSize,
      monthTripCount,
      monthTotalHits,
    };

    // ===== TOP3（簡易）用データ =====
    const fishingLogs = await prisma.fishingLog.findMany({
      where: {
        userId: user.id,
      },
      include: {
        events: {
          orderBy: { order: 'asc' },
          include: {
            lure: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // ===== エリア推定（catchに最も近いspotのarea） =====
    const getAreaForCatch = (logEvents: EventRow[], catchOrder: number): string => {
      const spotEvents = logEvents
        .filter((e) => e.type === 'spot' && e.area)
        .filter((e) => e.order <= catchOrder);
      if (spotEvents.length === 0) return '(未設定)';
      const nearest = spotEvents.reduce((a, b) => (a.order > b.order ? a : b));
      return nearest.area ?? '(未設定)';
    };

    // ===== エリアTOP3 =====
    const areaHitMap = new Map<string, number>();
    for (const log of fishingLogs) {
      const logEvents: EventRow[] = log.events.map((e) => ({
        type: e.type,
        order: e.order,
        area: e.area,
        lureId: e.lureId,
        lure: e.lure,
        sizeCm: e.sizeCm,
      }));
      const catchEvents = logEvents.filter((e) => e.type === 'catch');
      for (const c of catchEvents) {
        const area = getAreaForCatch(logEvents, c.order);
        areaHitMap.set(area, (areaHitMap.get(area) ?? 0) + 1);
      }
    }

    const topAreas: TopAreaItem[] = Array.from(areaHitMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area, hitCount]) => ({ area, hitCount }));

    // ===== ルアー集計 =====
    const lureHitMap = new Map<
      string,
      { lure: { name: string; color: string | null } | null; hitCount: number; usageCount: number }
    >();

    for (const log of fishingLogs) {
      const logEvents: EventRow[] = log.events.map((e) => ({
        type: e.type,
        order: e.order,
        area: e.area,
        lureId: e.lureId,
        lure: e.lure,
        sizeCm: e.sizeCm,
      }));

      const lureUsageSessions = new Map<string, number>();
      let currentLureId: string | null = null;

      for (const e of logEvents) {
        if ((e.type === 'use' || e.type === 'catch') && e.lureId) {
          if (e.lureId !== currentLureId) {
            lureUsageSessions.set(e.lureId, (lureUsageSessions.get(e.lureId) ?? 0) + 1);
            currentLureId = e.lureId;
          }

          if (e.type === 'catch') {
            const entry = lureHitMap.get(e.lureId) ?? {
              lure: e.lure,
              hitCount: 0,
              usageCount: 0,
            };
            entry.hitCount += 1;
            if (e.lure) {
              entry.lure = e.lure;
            }
            lureHitMap.set(e.lureId, entry);
          }
        }
      }

      for (const [lureId, sessions] of lureUsageSessions.entries()) {
        const existing = lureHitMap.get(lureId);
        if (existing) {
          existing.usageCount += sessions;
        } else {
          const lureEvent = logEvents.find((e) => e.lureId === lureId && e.lure);
          lureHitMap.set(lureId, {
            lure: lureEvent?.lure ?? null,
            hitCount: 0,
            usageCount: sessions,
          });
        }
      }
    }

    const lureStats = Array.from(lureHitMap.entries())
      .map(([lureId, data]) => ({
        lureId,
        label: buildLureLabel(data.lure, lureId),
        hitCount: data.hitCount,
        usageCount: data.usageCount,
      }))
      .sort((a, b) => {
        if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
        return b.usageCount - a.usageCount;
      });

    const topLures: TopLureItem[] = lureStats.slice(0, 3);
    const lureHitsTop: TopLureItem[] = lureStats
      .slice()
      .sort((a, b) => {
        if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
        return (b.usageCount ?? 0) - (a.usageCount ?? 0);
      })
      .slice(0, 3);

    const response: DashboardSummaryResponse = {
      overview,
      topAreas,
      topLures,
      lureHitsTop,
    };

    return NextResponse.json(response);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return e;
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
