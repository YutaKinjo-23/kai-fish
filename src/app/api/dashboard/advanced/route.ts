import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFeature } from '@/lib/api/guards';
import type { HeatmapData, SizeHistItem } from '@/types/dashboard';

type DashboardAdvancedRange = 'month' | '3months' | 'all';

type DashboardAdvancedResponse = {
  range: DashboardAdvancedRange;
  heatmap: HeatmapData;
  sizeHist: SizeHistItem[];
  sizeUnknownCount: number;
};

function isDashboardAdvancedRange(value: string): value is DashboardAdvancedRange {
  return value === 'month' || value === '3months' || value === 'all';
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

function getDateRange(range: DashboardAdvancedRange): { from: Date | null; to: Date } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (range) {
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to };
    }
    case '3months': {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from, to };
    }
    case 'all':
    default:
      return { from: null, to };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireFeature('dashboard.advanced');

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') ?? 'month';
    const range: DashboardAdvancedRange = isDashboardAdvancedRange(rangeParam)
      ? rangeParam
      : 'month';

    const { from: rangeFrom, to: rangeTo } = getDateRange(range);
    const dateFilter = rangeFrom ? { gte: rangeFrom, lte: rangeTo } : { lte: rangeTo };

    const fishingLogs = await prisma.fishingLog.findMany({
      where: {
        userId: user.id,
        date: dateFilter,
      },
      include: {
        events: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    // ===== ヒートマップ =====
    const xLabels: string[] = [];
    const xKeyMap = new Map<string, number>();

    if (range === 'all') {
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
      const { from } = getDateRange(range);
      const fromDate = from ?? rangeTo;
      const cursor = new Date(fromDate);
      cursor.setHours(0, 0, 0, 0);

      const end = new Date(rangeTo);
      end.setHours(0, 0, 0, 0);

      let i = 0;
      while (cursor <= end) {
        const key = toLocalDateString(cursor);
        xLabels.push(formatDateLabel(cursor));
        xKeyMap.set(key, i);
        i += 1;
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const yHours = Array.from({ length: 24 }, (_, i) => i);
    const heatmapValues: (number | null)[][] = yHours.map(() => xLabels.map(() => null));

    for (const log of fishingLogs) {
      const logEvents = log.events;

      const startEvent = logEvents.find((e) => e.type === 'start');
      const endEvent = logEvents.find((e) => e.type === 'end');

      const startHour = parseHour(startEvent?.time ?? '');
      const endHour = parseHour(endEvent?.time ?? '');

      const logDate = log.date;

      if (startHour !== null && endHour !== null) {
        const crossesMidnight = endHour < startHour;

        if (crossesMidnight) {
          for (let h = startHour; h <= 23; h++) {
            const xKey =
              range === 'all'
                ? `${logDate.getFullYear()}-${logDate.getMonth()}`
                : toLocalDateString(logDate);
            const xIndex = xKeyMap.get(xKey);
            if (xIndex !== undefined && heatmapValues[h][xIndex] === null) {
              heatmapValues[h][xIndex] = 0;
            }
          }

          const nextDay = new Date(logDate);
          nextDay.setDate(nextDay.getDate() + 1);
          for (let h = 0; h <= endHour; h++) {
            const xKey =
              range === 'all'
                ? `${nextDay.getFullYear()}-${nextDay.getMonth()}`
                : toLocalDateString(nextDay);
            const xIndex = xKeyMap.get(xKey);
            if (xIndex !== undefined && heatmapValues[h][xIndex] === null) {
              heatmapValues[h][xIndex] = 0;
            }
          }
        } else {
          const xKey =
            range === 'all'
              ? `${logDate.getFullYear()}-${logDate.getMonth()}`
              : toLocalDateString(logDate);
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
        const xKey =
          range === 'all'
            ? `${logDate.getFullYear()}-${logDate.getMonth()}`
            : toLocalDateString(logDate);
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

      const catchEvents = logEvents.filter((e) => e.type === 'catch');
      for (const c of catchEvents) {
        const hour = parseHour(c.time);
        if (hour === null) continue;

        let catchDate = logDate;
        if (startHour !== null && hour < startHour && endHour !== null && endHour < startHour) {
          if (hour <= endHour) {
            catchDate = new Date(logDate);
            catchDate.setDate(catchDate.getDate() + 1);
          }
        }

        const xKey =
          range === 'all'
            ? `${catchDate.getFullYear()}-${catchDate.getMonth()}`
            : toLocalDateString(catchDate);
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

    const catchEvents = fishingLogs.flatMap((log) => log.events).filter((e) => e.type === 'catch');
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

    const response: DashboardAdvancedResponse = {
      range,
      heatmap,
      sizeHist,
      sizeUnknownCount,
    };

    return NextResponse.json(response);
  } catch (e: unknown) {
    if (e instanceof Response) {
      return e;
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
