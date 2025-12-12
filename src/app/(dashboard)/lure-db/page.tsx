'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SEASONS, TIDES, TIME_ZONES, WATER_QUALITIES } from './_lib/lure-conditions';
import type { Lure } from '@/types/tackle';

interface LureListItem extends Lure {
  hitCount?: number;
  usageCount?: number;
  avgSizeCm?: number | null;
}

interface SpotOption {
  area: string;
  spotName: string;
}

export default function LureDBPage() {
  const [areaOptions, setAreaOptions] = useState<{ value: string; label: string }[]>([]);
  const [spotOptions, setSpotOptions] = useState<{ value: string; label: string }[]>([]);
  const [lures, setLures] = useState<LureListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [q, setQ] = useState('');
  const [area, setArea] = useState('');
  const [spot, setSpot] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [season, setSeason] = useState('');
  const [tide, setTide] = useState('');
  const [waterQuality, setWaterQuality] = useState('');

  // 釣行記録から使用されたエリアとスポットを取得
  useEffect(() => {
    async function fetchSpotsFromLogs() {
      try {
        const res = await fetch('/api/fishing-logs/spots');
        if (res.ok) {
          const data = await res.json();
          const spots: SpotOption[] = data.spots || [];

          // エリアの重複を排除
          const areas = [...new Set(spots.map((s) => s.area).filter(Boolean))];
          setAreaOptions(areas.map((a) => ({ value: a, label: a })));

          // スポットの重複を排除（エリア付きで表示）
          const spotSet = new Map<string, string>();
          spots.forEach((s) => {
            if (s.spotName && !spotSet.has(s.spotName)) {
              spotSet.set(s.spotName, s.area || '');
            }
          });
          setSpotOptions(
            Array.from(spotSet.entries()).map(([name, areaName]) => ({
              value: name,
              label: areaName ? `${name} (${areaName})` : name,
            }))
          );
        }
      } catch {
        setAreaOptions([]);
        setSpotOptions([]);
      }
    }
    fetchSpotsFromLogs();
  }, []);

  useEffect(() => {
    async function fetchLures() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim().length > 0) params.set('q', q.trim());
        if (area.trim().length > 0) params.set('area', area.trim());
        if (spot.trim().length > 0) params.set('spot', spot.trim());
        if (timeZone.trim().length > 0) params.set('timeZone', timeZone.trim());
        if (season.trim().length > 0) params.set('season', season.trim());
        if (tide.trim().length > 0) params.set('tide', tide.trim());
        if (waterQuality.trim().length > 0) params.set('waterQuality', waterQuality.trim());
        params.set('includeStats', '1');

        const res = await fetch(`/api/tackle/lures?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLures(data.lures || []);
        } else {
          setLures([]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchLures();
  }, [q, area, spot, timeZone, season, tide, waterQuality]);

  return (
    <AppLayout pageTitle="ルアー図鑑">
      <Card>
        <CardHeader>
          <h2>ルアー図鑑</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">検索</label>
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="製品名 / メーカー / カラー"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">エリア</label>
                <Select
                  value={area}
                  onChange={(value) => setArea(value)}
                  options={areaOptions}
                  placeholder="エリアを選択"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">スポット</label>
                <Select
                  value={spot}
                  onChange={(value) => setSpot(value)}
                  options={spotOptions}
                  placeholder="スポットを選択"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">時間帯</label>
                <Select
                  value={timeZone}
                  onChange={(value) => setTimeZone(value)}
                  options={TIME_ZONES.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="デイ/ナイト"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">季節</label>
                <Select
                  value={season}
                  onChange={(value) => setSeason(value)}
                  options={SEASONS.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="春/夏/秋/冬"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">潮</label>
                <Select
                  value={tide}
                  onChange={(value) => setTide(value)}
                  options={TIDES.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="大潮/中潮/小潮/長潮"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">水質</label>
                <Select
                  value={waterQuality}
                  onChange={(value) => setWaterQuality(value)}
                  options={WATER_QUALITIES.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="澄み/やや濁り/濁り"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQ('');
                    setArea('');
                    setSpot('');
                    setTimeZone('');
                    setSeason('');
                    setTide('');
                    setWaterQuality('');
                  }}
                >
                  クリア
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              {isLoading ? (
                <p className="text-gray-500">読み込み中...</p>
              ) : lures.length === 0 ? (
                <p className="text-gray-500">条件に合うルアーがありません。</p>
              ) : (
                <div className="space-y-3">
                  {lures.map((lure) => (
                    <Link
                      key={lure.id}
                      href={`/lure-db/${lure.id}`}
                      className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {lure.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={lure.imageUrl}
                              alt={lure.name}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {lure.name}
                                {lure.color ? ` / ${lure.color}` : ''}
                              </p>
                              <p className="text-xs text-gray-500">
                                {lure.recommendedRig
                                  ? `リグ例: ${lure.recommendedRig}`
                                  : 'リグ例: -'}
                                {lure.recommendedSinkerWeight &&
                                  ` / シンカー例: ${lure.recommendedSinkerWeight}`}
                                {lure.recommendedHook && ` / フック例: ${lure.recommendedHook}`}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-500">
                                使用 {lure.usageCount ?? 0} / ヒット {lure.hitCount ?? 0}
                              </p>
                              {(lure.usageCount ?? 0) > 0 && (
                                <p className="text-xs text-gray-400">
                                  参考効率{' '}
                                  {Math.round(
                                    ((lure.hitCount ?? 0) / (lure.usageCount ?? 1)) * 100
                                  )}
                                  %
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                評価 {lure.rating ? `★${lure.rating}` : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
