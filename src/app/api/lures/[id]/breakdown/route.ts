import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFeature } from '@/lib/api/guards';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // 1. 権限チェック
    // Freeの場合はここで例外(Response)が投げられる
    await requireFeature('lures.breakdown');

    // 2. データ取得
    // 対象イベント: FishingEvent where { lureId = params.id, type = 'catch' }
    const events = await prisma.fishingEvent.findMany({
      where: {
        lureId: id,
        type: 'catch',
      },
      select: {
        time: true,
        area: true,
        spotName: true,
        rigType: true,
      },
    });

    // 3. 集計

    // byTimeOfDay: 0-23の24要素を必ず返す
    const byTimeOfDay = Array.from({ length: 24 }, (_, i) => ({ hour: i, hits: 0 }));
    events.forEach((e) => {
      if (e.time) {
        const hour = parseInt(e.time.split(':')[0], 10);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          byTimeOfDay[hour].hits++;
        }
      }
    });

    // byTide: rising | falling | slack | unknown の4要素を必ず返す
    // 現状データがないため全てunknownに計上
    const byTide = [
      { tide: 'rising', hits: 0 },
      { tide: 'falling', hits: 0 },
      { tide: 'slack', hits: 0 },
      { tide: 'unknown', hits: events.length },
    ];

    // bySpot: spotId別のhits上位10件
    // spotIdがないため、spotName または area を識別子として使用
    const spotMap = new Map<string, number>();
    events.forEach((e) => {
      // spotNameがあればそれ、なければarea、両方なければ'unknown'
      const spotLabel = e.spotName || e.area || 'unknown';
      spotMap.set(spotLabel, (spotMap.get(spotLabel) ?? 0) + 1);
    });
    const bySpot = Array.from(spotMap.entries())
      .map(([spotId, hits]) => ({ spotId, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    // byRig: rigId別のhits上位10件
    // rigIdがないため、rigTypeを識別子として使用
    const rigMap = new Map<string, number>();
    events.forEach((e) => {
      const rigLabel = e.rigType || 'unknown';
      rigMap.set(rigLabel, (rigMap.get(rigLabel) ?? 0) + 1);
    });
    const byRig = Array.from(rigMap.entries())
      .map(([rigId, hits]) => ({ rigId, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    return NextResponse.json({
      lureId: id,
      byTimeOfDay,
      byTide,
      bySpot,
      byRig,
    });
  } catch (e: unknown) {
    if (e instanceof Response) {
      return e;
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
