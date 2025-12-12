import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';
import type {
  DashboardRange,
  DashboardResponse,
  DashboardOverview,
  TopAreaItem,
  TopSpotItem,
  TopLureItem,
  HeatmapData,
  SizeHistItem,
} from '@/types/dashboard';

// 期間に応じた日付範囲を取得
function getDateRange(range: DashboardRange): { from: Date | null; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (range) {
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to };
    }
    case 'last30': {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }
    case 'all':
    default:
      return { from: null, to };
  }
}

// 今月の範囲を取得
function getThisMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from, to };
}

// 時刻文字列から時間を抽出
function parseHour(time: string): number | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  if (hour < 0 || hour > 23) return null;
  return hour;
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

// サイズバケット分類
function getSizeBucket(sizeCm: number): string {
  if (sizeCm <= 15) return '〜15';
  if (sizeCm <= 20) return '〜20';
  if (sizeCm <= 25) return '〜25';
  if (sizeCm <= 30) return '〜30';
  return '30+';
}

// 日付フォーマット
function formatDateLabel(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}/${d}`;
}

// ローカルタイムゾーンでYYYY-MM-DD形式の文字列を取得
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 月フォーマット
function formatMonthLabel(year: number, month: number): string {
  return `${year}/${String(month + 1).padStart(2, '0')}`;
}

interface EventRow {
  id: string;
  type: string;
  time: string;
  order: number;
  area: string | null;
  spotName: string | null;
  lureId: string | null;
  sizeCm: number | null;
  lure: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  fishingLog: {
    id: string;
    date: Date;
  };
}

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

  // クエリパラメータ取得
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range') || 'month';
  const range: DashboardRange = ['month', 'last30', 'all'].includes(rangeParam)
    ? (rangeParam as DashboardRange)
    : 'month';

  const { from: rangeFrom, to: rangeTo } = getDateRange(range);
  const { from: monthFrom, to: monthTo } = getThisMonthRange();

  // ===== 釣行データ取得 =====
  const dateFilter = rangeFrom ? { gte: rangeFrom, lte: rangeTo } : { lte: rangeTo };

  const fishingLogs = await prisma.fishingLog.findMany({
    where: {
      userId: user.id,
      date: dateFilter,
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
  // 直近10回の平均ヒット数・最大サイズ
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

  // 今月の釣行回数・合計釣果
  const monthTripCount = monthLogs.length;
  const monthTotalHits = monthLogs.reduce((sum, log) => sum + log.events.length, 0);

  const overview: DashboardOverview = {
    recentAvgHits: recentAvgHits !== null ? Math.round(recentAvgHits * 10) / 10 : null,
    recentMaxSize,
    monthTripCount,
    monthTotalHits,
  };

  // ===== イベントをフラット化 =====
  const allEvents: EventRow[] = fishingLogs.flatMap((log) =>
    log.events.map((e) => ({
      ...e,
      fishingLog: { id: log.id, date: log.date },
    }))
  );

  // ===== エリア推定（catchに最も近いspotのarea） =====
  const getAreaForCatch = (logEvents: EventRow[], catchOrder: number): string => {
    const spotEvents = logEvents
      .filter((e) => e.type === 'spot' && e.area)
      .filter((e) => e.order <= catchOrder);
    if (spotEvents.length === 0) return '(未設定)';
    // 最も近い（直前優先）= order最大
    const nearest = spotEvents.reduce((a, b) => (a.order > b.order ? a : b));
    return nearest.area ?? '(未設定)';
  };

  // ===== エリアTOP3 =====
  const areaHitMap = new Map<string, number>();
  for (const log of fishingLogs) {
    const logEvents = allEvents.filter((e) => e.fishingLog.id === log.id);
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

  // ===== スポット推定（catchに最も近いspotのarea+spotName） =====
  const getSpotForCatch = (
    logEvents: EventRow[],
    catchOrder: number
  ): { area: string; spotName: string } => {
    const spotEvents = logEvents
      .filter((e) => e.type === 'spot' && (e.area || e.spotName))
      .filter((e) => e.order <= catchOrder);
    if (spotEvents.length === 0) return { area: '(未設定)', spotName: '' };
    const nearest = spotEvents.reduce((a, b) => (a.order > b.order ? a : b));
    return {
      area: nearest.area ?? '(未設定)',
      spotName: nearest.spotName ?? '',
    };
  };

  // ===== スポットTOP3（訪問回数とヒット数の両方を集計） =====
  const spotStatsMap = new Map<
    string,
    { area: string; spotName: string; hitCount: number; visitCount: number }
  >();

  for (const log of fishingLogs) {
    const logEvents = allEvents.filter((e) => e.fishingLog.id === log.id);

    // スポット訪問をカウント（spotイベントごとに1回）
    const spotEvents = logEvents.filter((e) => e.type === 'spot' && (e.area || e.spotName));
    for (const s of spotEvents) {
      const key = `${s.area ?? '(未設定)'}|||${s.spotName ?? ''}`;
      const existing = spotStatsMap.get(key);
      if (existing) {
        existing.visitCount += 1;
      } else {
        spotStatsMap.set(key, {
          area: s.area ?? '(未設定)',
          spotName: s.spotName ?? '',
          hitCount: 0,
          visitCount: 1,
        });
      }
    }

    // ヒット数をカウント（catchイベントに紐づくスポット）
    const catchEvents = logEvents.filter((e) => e.type === 'catch');
    for (const c of catchEvents) {
      const spot = getSpotForCatch(logEvents, c.order);
      const key = `${spot.area}|||${spot.spotName}`;
      const existing = spotStatsMap.get(key);
      if (existing) {
        existing.hitCount += 1;
      } else {
        spotStatsMap.set(key, {
          area: spot.area,
          spotName: spot.spotName,
          hitCount: 1,
          visitCount: 0,
        });
      }
    }
  }

  const topSpots: TopSpotItem[] = Array.from(spotStatsMap.values())
    .sort((a, b) => {
      // まずヒット数で降順、同じならvisitCountで降順
      if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
      return b.visitCount - a.visitCount;
    })
    .slice(0, 3)
    .map(({ area, spotName, hitCount, visitCount }) => ({
      area,
      spotName,
      hitCount,
      visitCount,
    }));

  // ===== ルアー集計 =====
  // 使用回数の定義: useイベントの後に同じルアーでcatchがあった場合は1回としてカウント
  // つまり「ルアーを変えた回数」をカウントする
  const lureHitMap = new Map<
    string,
    { lure: { name: string; color: string | null } | null; hitCount: number; usageCount: number }
  >();

  // 釣行ログごとにルアー使用回数を計算
  for (const log of fishingLogs) {
    const logEvents = allEvents
      .filter((e) => e.fishingLog.id === log.id)
      .sort((a, b) => a.order - b.order);

    // 釣行内で各ルアーの使用セッションをカウント
    // use/catchが連続している間は同一セッションとして扱う
    const lureUsageSessions = new Map<string, number>(); // lureId -> セッション数
    let currentLureId: string | null = null;

    for (const e of logEvents) {
      if ((e.type === 'use' || e.type === 'catch') && e.lureId) {
        // ルアーが変わった場合のみ新しいセッションとしてカウント
        if (e.lureId !== currentLureId) {
          lureUsageSessions.set(e.lureId, (lureUsageSessions.get(e.lureId) ?? 0) + 1);
          currentLureId = e.lureId;
        }

        // hitCountはcatchイベントごとにカウント
        if (e.type === 'catch') {
          const entry = lureHitMap.get(e.lureId) ?? {
            lure: e.lure,
            hitCount: 0,
            usageCount: 0,
          };
          entry.hitCount += 1;
          // lureの情報を更新（nullでない場合）
          if (e.lure) {
            entry.lure = e.lure;
          }
          lureHitMap.set(e.lureId, entry);
        }
      }
    }

    // 釣行ごとの使用セッション数をusageCountに加算
    for (const [lureId, sessions] of lureUsageSessions.entries()) {
      const existing = lureHitMap.get(lureId);
      if (existing) {
        existing.usageCount += sessions;
      } else {
        // hitCountが0だがuseされたルアー
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
  const lureBar: TopLureItem[] = lureStats.slice(0, 10);

  // ===== ヒートマップ =====
  // X軸ラベル生成（range依存）
  const xLabels: string[] = [];
  const xKeyMap = new Map<string, number>(); // key -> index

  if (range === 'all') {
    // 月単位
    const monthSet = new Set<string>();
    for (const log of fishingLogs) {
      const y = log.date.getFullYear();
      const m = log.date.getMonth();
      monthSet.add(`${y}-${m}`);
    }
    const sorted = Array.from(monthSet).sort();
    sorted.forEach((key, i) => {
      const [y, m] = key.split('-').map(Number);
      xLabels.push(formatMonthLabel(y, m));
      xKeyMap.set(key, i);
    });
  } else {
    // 日単位（直近14日 or 30日）
    const days = range === 'last30' ? 30 : 14;
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toLocalDateString(d);
      xLabels.push(formatDateLabel(d));
      xKeyMap.set(key, days - 1 - i);
    }
  }

  const yHours = Array.from({ length: 24 }, (_, i) => i);
  const heatmapValues: (number | null)[][] = yHours.map(() => xLabels.map(() => null));

  // 釣行あり＝観測あり、でセルを0初期化
  // startイベントからendイベントまでの時間帯をすべて観測済みとして扱う

  for (const log of fishingLogs) {
    const logEvents = allEvents.filter((e) => e.fishingLog.id === log.id);

    // startとendイベントを取得
    const startEvent = logEvents.find((e) => e.type === 'start');
    const endEvent = logEvents.find((e) => e.type === 'end');

    const startHour = parseHour(startEvent?.time ?? '');
    const endHour = parseHour(endEvent?.time ?? '');

    // 日付を取得（ログの日付を基準）
    const logDate = log.date;

    // start/endが両方あれば、その間の時間帯を観測済みとして扱う
    if (startHour !== null && endHour !== null) {
      // 日付またぎを考慮
      // endHour < startHour の場合、翌日にまたがっていると判断
      const crossesMidnight = endHour < startHour;

      if (crossesMidnight) {
        // 当日のstartHour〜23時
        for (let h = startHour; h <= 23; h++) {
          let xKey: string;
          if (range === 'all') {
            xKey = `${logDate.getFullYear()}-${logDate.getMonth()}`;
          } else {
            xKey = toLocalDateString(logDate);
          }
          const xIndex = xKeyMap.get(xKey);
          if (xIndex !== undefined && heatmapValues[h][xIndex] === null) {
            heatmapValues[h][xIndex] = 0;
          }
        }

        // 翌日の0時〜endHour
        const nextDay = new Date(logDate);
        nextDay.setDate(nextDay.getDate() + 1);
        for (let h = 0; h <= endHour; h++) {
          let xKey: string;
          if (range === 'all') {
            xKey = `${nextDay.getFullYear()}-${nextDay.getMonth()}`;
          } else {
            xKey = toLocalDateString(nextDay);
          }
          const xIndex = xKeyMap.get(xKey);
          if (xIndex !== undefined && heatmapValues[h][xIndex] === null) {
            heatmapValues[h][xIndex] = 0;
          }
        }
      } else {
        // 同日内：startHour〜endHour
        let xKey: string;
        if (range === 'all') {
          xKey = `${logDate.getFullYear()}-${logDate.getMonth()}`;
        } else {
          xKey = toLocalDateString(logDate);
        }
        const xIndex = xKeyMap.get(xKey);
        if (xIndex !== undefined) {
          for (let h = startHour; h <= endHour; h++) {
            if (heatmapValues[h][xIndex] === null) {
              heatmapValues[h][xIndex] = 0;
            }
          }
        }
      }
    } else {
      // start/endが不完全な場合は、各イベントの時刻のみを観測済みとして扱う（従来通り）
      let xKey: string;
      if (range === 'all') {
        xKey = `${logDate.getFullYear()}-${logDate.getMonth()}`;
      } else {
        xKey = toLocalDateString(logDate);
      }
      const xIndex = xKeyMap.get(xKey);
      if (xIndex !== undefined) {
        for (const e of logEvents) {
          const hour = parseHour(e.time);
          if (hour !== null && heatmapValues[hour][xIndex] === null) {
            heatmapValues[hour][xIndex] = 0;
          }
        }
      }
    }

    // catchイベントをカウント（日付またぎを考慮）
    const catchEvents = logEvents.filter((e) => e.type === 'catch');
    for (const c of catchEvents) {
      const hour = parseHour(c.time);
      if (hour === null) continue;

      // catchの時刻がstartより前なら翌日と判断
      let catchDate = logDate;
      if (startHour !== null && hour < startHour && endHour !== null && endHour < startHour) {
        // 日付またぎの場合で、catchがendHour以下なら翌日
        if (hour <= endHour) {
          catchDate = new Date(logDate);
          catchDate.setDate(catchDate.getDate() + 1);
        }
      }

      let xKey: string;
      if (range === 'all') {
        xKey = `${catchDate.getFullYear()}-${catchDate.getMonth()}`;
      } else {
        xKey = toLocalDateString(catchDate);
      }
      const xIndex = xKeyMap.get(xKey);
      if (xIndex !== undefined) {
        const current = heatmapValues[hour][xIndex];
        heatmapValues[hour][xIndex] = (current ?? 0) + 1;
      }
    }
  }

  const heatmap: HeatmapData = {
    xLabels,
    yHours,
    values: heatmapValues,
  };

  // ===== サイズ分布ヒストグラム =====
  const bucketOrder = ['〜15', '〜20', '〜25', '〜30', '30+'];
  const bucketCounts = new Map<string, number>(bucketOrder.map((b) => [b, 0]));
  let sizeUnknownCount = 0;

  const catchEvents = allEvents.filter((e) => e.type === 'catch');
  for (const c of catchEvents) {
    if (c.sizeCm !== null && c.sizeCm > 0) {
      const bucket = getSizeBucket(c.sizeCm);
      bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
    } else {
      sizeUnknownCount += 1;
    }
  }

  const sizeHist: SizeHistItem[] = bucketOrder.map((bucketLabel) => ({
    bucketLabel,
    count: bucketCounts.get(bucketLabel) ?? 0,
  }));

  // ===== レスポンス生成 =====
  const response: DashboardResponse = {
    overview,
    topAreas,
    topSpots,
    topLures,
    heatmap,
    lureBar,
    sizeHist,
    meta: {
      range,
      generatedAt: new Date().toISOString(),
      sizeUnknownCount,
    },
  };

  return NextResponse.json(response);
}
