'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useFeatures } from '@/features/me/useFeatures';
import type { DashboardRange, DashboardResponse } from '@/types/dashboard';

const RANGE_OPTIONS = [
  { value: 'month', label: '今月' },
  { value: 'last30', label: '直近30日' },
  { value: 'all', label: '全期間' },
];

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>('month');
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasFeature } = useFeatures();

  const fetchData = useCallback(async (r: DashboardRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?range=${r}`);
      if (!res.ok) {
        throw new Error('データの取得に失敗しました。');
      }
      const json: DashboardResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  return (
    <AppLayout pageTitle="ダッシュボード">
      <div className="space-y-6">
        {/* 期間切り替え */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">期間:</span>
          <div className="w-40">
            <Select
              value={range}
              onChange={(v) => setRange(v as DashboardRange)}
              options={RANGE_OPTIONS}
              placeholder="期間を選択"
            />
          </div>
        </div>

        {/* ローディング/エラー */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        )}
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}

        {data && !loading && (
          <>
            {/* 概要カード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <OverviewCard
                title="直近10回の平均ヒット"
                value={
                  data.overview.recentAvgHits !== null ? `${data.overview.recentAvgHits}` : '-'
                }
                unit="匹/回"
              />
              <OverviewCard
                title="直近10回の最大サイズ"
                value={
                  data.overview.recentMaxSize !== null ? `${data.overview.recentMaxSize}` : '-'
                }
                unit="cm"
              />
              <OverviewCard
                title="今月の釣行回数"
                value={`${data.overview.monthTripCount}`}
                unit="回"
              />
              <OverviewCard
                title="今月の合計釣果"
                value={`${data.overview.monthTotalHits}`}
                unit="匹"
              />
            </div>

            {/* TOP3エリア・ルアー */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">エリアTOP3</h3>
                </CardHeader>
                <CardContent>
                  {data.topAreas.length === 0 ? (
                    <p className="text-gray-500 text-sm">データがありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.topAreas.map((item, i) => (
                        <li key={item.area} className="flex justify-between items-center">
                          <span className="flex items-center gap-2">
                            <span className="text-lg font-bold text-brand-primary">{i + 1}</span>
                            <span>{item.area}</span>
                          </span>
                          <span className="font-semibold">{item.hitCount}匹</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">ルアーTOP3</h3>
                </CardHeader>
                <CardContent>
                  {data.topLures.length === 0 ? (
                    <p className="text-gray-500 text-sm">データがありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.topLures.map((item, i) => (
                        <li key={item.lureId} className="flex justify-between items-center gap-2">
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-lg font-bold text-brand-primary flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="truncate" title={item.label}>
                              {item.label}
                            </span>
                          </span>
                          <span className="font-semibold whitespace-nowrap flex-shrink-0">
                            {item.hitCount}匹
                            {item.usageCount !== undefined && (
                              <span className="text-gray-500 text-sm ml-1">
                                ({item.usageCount}回)
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* グラフ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ヒートマップ */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <h3 className="text-lg font-semibold">時間帯×ヒット数ヒートマップ</h3>
                </CardHeader>
                <CardContent>
                  <HeatmapChart data={data.heatmap} />
                </CardContent>
              </Card>

              {/* ルアー別ヒット棒グラフ */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">ルアー別ヒット数</h3>
                </CardHeader>
                <CardContent>
                  <LureBarChart data={data.lureBar} />
                </CardContent>
              </Card>

              {/* サイズ分布ヒストグラム */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">サイズ分布</h3>
                </CardHeader>
                <CardContent>
                  <SizeHistogram data={data.sizeHist} unknownCount={data.meta.sizeUnknownCount} />
                </CardContent>
              </Card>
            </div>

            {/* 注釈 */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>これは釣行記録の集計です（釣果を保証するものではありません）。</p>
              <p>未入力の項目は集計対象外（未観測）として扱います。</p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ===== サブコンポーネント =====

interface OverviewCardProps {
  title: string;
  value: string;
  unit: string;
}

function OverviewCard({ title, value, unit }: OverviewCardProps) {
  return (
    <Card>
      <CardContent className="text-center py-4">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-brand-primary">{value}</p>
        <p className="text-sm text-gray-500">{unit}</p>
      </CardContent>
    </Card>
  );
}

interface HeatmapChartProps {
  data: DashboardResponse['heatmap'];
}

function HeatmapChart({ data }: HeatmapChartProps) {
  if (data.xLabels.length === 0) {
    return <p className="text-gray-500 text-sm">データがありません</p>;
  }

  // 表示する時間帯を絞る（例: 4時〜22時）
  const displayHours = data.yHours.filter((h) => h >= 4 && h <= 22);

  // 最大値を取得（色の濃さ計算用）
  const allValues = data.values.flat().filter((v): v is number => v !== null);
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;

  const getColor = (val: number | null): string => {
    if (val === null) return 'bg-gray-100';
    if (val === 0) return 'bg-gray-200';
    const intensity = Math.min(val / maxVal, 1);
    if (intensity < 0.25) return 'bg-blue-200';
    if (intensity < 0.5) return 'bg-blue-300';
    if (intensity < 0.75) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* ヘッダー（X軸ラベル） */}
        <div className="flex">
          <div className="w-12 flex-shrink-0" />
          {data.xLabels.map((label) => (
            <div
              key={label}
              className="flex-1 text-xs text-center text-gray-600 px-0.5 truncate"
              style={{ minWidth: '20px' }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* グリッド */}
        {displayHours.map((hour) => (
          <div key={hour} className="flex">
            <div className="w-12 flex-shrink-0 text-xs text-gray-600 text-right pr-2 py-1">
              {hour}:00
            </div>
            {data.xLabels.map((label, xIdx) => {
              const val = data.values[hour][xIdx];
              return (
                <div
                  key={`${hour}-${label}`}
                  className={`flex-1 h-6 ${getColor(val)} border border-white flex items-center justify-center`}
                  style={{ minWidth: '20px' }}
                  title={val === null ? '未観測' : `${val}匹`}
                >
                  {val !== null && val > 0 && (
                    <span className="text-xs text-white font-medium">{val}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* 凡例 */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <span>凡例:</span>
          <span className="w-4 h-4 bg-gray-100 border"></span>
          <span>未観測</span>
          <span className="w-4 h-4 bg-gray-200 border"></span>
          <span>0</span>
          <span className="w-4 h-4 bg-blue-200 border"></span>
          <span>少</span>
          <span className="w-4 h-4 bg-blue-500 border"></span>
          <span>多</span>
        </div>
      </div>
    </div>
  );
}

interface LureBarChartProps {
  data: DashboardResponse['lureBar'];
}

function LureBarChart({ data }: LureBarChartProps) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-sm">データがありません</p>;
  }

  const maxHit = Math.max(...data.map((d) => d.hitCount), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.lureId} className="flex items-center gap-2">
          <div className="w-32 truncate text-sm" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded"
              style={{ width: `${(item.hitCount / maxHit) * 100}%` }}
            />
          </div>
          <div className="w-16 text-right text-sm">
            {item.hitCount}匹
            {item.usageCount !== undefined && (
              <span className="text-gray-400 text-xs ml-1">({item.usageCount})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface SizeHistogramProps {
  data: DashboardResponse['sizeHist'];
  unknownCount: number;
}

function SizeHistogram({ data, unknownCount }: SizeHistogramProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0 && unknownCount === 0) {
    return <p className="text-gray-500 text-sm">データがありません</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-32">
        {data.map((item) => (
          <div key={item.bucketLabel} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-brand-primary rounded-t"
              style={{
                height: `${(item.count / maxCount) * 100}%`,
                minHeight: item.count > 0 ? '4px' : '0',
              }}
            />
            <span className="text-xs text-gray-600 mt-1">{item.bucketLabel}</span>
            <span className="text-xs font-medium">{item.count}</span>
          </div>
        ))}
      </div>
      {unknownCount > 0 && (
        <p className="text-xs text-gray-500">※ サイズ未入力: {unknownCount}件</p>
      )}
    </div>
  );
}
