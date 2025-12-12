'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useFeatures } from '@/features/me/useFeatures';
import { useHandlePlanForbidden } from '@/features/plan/useHandlePlanForbidden';
import { fetchJson } from '@/lib/api/client';
import type { DashboardResponse } from '@/types/dashboard';

type DashboardAdvancedRange = 'month' | '3months' | 'all';

type DashboardSummaryResponse = {
  overview: DashboardResponse['overview'];
  topAreas: DashboardResponse['topAreas'];
  topSpots: DashboardResponse['topSpots'];
  topLures: DashboardResponse['topLures'];
  lureHitsTop: DashboardResponse['lureBar'];
};

type DashboardAdvancedResponse = {
  range: DashboardAdvancedRange;
  heatmap: DashboardResponse['heatmap'];
  sizeHist: DashboardResponse['sizeHist'];
  sizeUnknownCount: number;
};

function isDashboardAdvancedRange(value: string): value is DashboardAdvancedRange {
  return value === 'month' || value === '3months' || value === 'all';
}

const ADVANCED_RANGE_OPTIONS = [
  { value: 'month', label: '今月' },
  { value: '3months', label: '直近3ヶ月' },
  { value: 'all', label: '全期間' },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [advanced, setAdvanced] = useState<DashboardAdvancedResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [advancedRange, setAdvancedRange] = useState<DashboardAdvancedRange>('month');
  const { hasFeature } = useFeatures();
  const handlePlanForbidden = useHandlePlanForbidden();

  const canUseAdvanced = hasFeature('dashboard.advanced');

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const json = await fetchJson<DashboardSummaryResponse>('/api/dashboard/summary');
      setSummary(json);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchAdvanced = useCallback(
    async (r: DashboardAdvancedRange) => {
      setAdvancedLoading(true);
      setAdvancedError(null);
      try {
        const json = await fetchJson<DashboardAdvancedResponse>(
          `/api/dashboard/advanced?range=${r}`
        );
        setAdvanced(json);
      } catch (e) {
        if (handlePlanForbidden(e)) {
          setAdvanced(null);
          return;
        }
        console.error(e);
        setAdvancedError(e instanceof Error ? e.message : '不明なエラー');
      } finally {
        setAdvancedLoading(false);
      }
    },
    [handlePlanForbidden]
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (!canUseAdvanced) return;
    fetchAdvanced(advancedRange);
  }, [canUseAdvanced, advancedRange, fetchAdvanced]);

  return (
    <AppLayout pageTitle="ダッシュボード">
      <div className="space-y-6">
        {/* ローディング/エラー */}
        {summaryLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        )}
        {summaryError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{summaryError}</div>
        )}

        {summary && !summaryLoading && (
          <>
            {/* 概要カード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <OverviewCard
                title="直近10回の平均ヒット"
                value={
                  summary.overview.recentAvgHits !== null
                    ? `${summary.overview.recentAvgHits}`
                    : '-'
                }
                unit="匹/回"
              />
              <OverviewCard
                title="直近10回の最大サイズ"
                value={
                  summary.overview.recentMaxSize !== null
                    ? `${summary.overview.recentMaxSize}`
                    : '-'
                }
                unit="cm"
              />
              <OverviewCard
                title="今月の釣行回数"
                value={`${summary.overview.monthTripCount}`}
                unit="回"
              />
              <OverviewCard
                title="今月の合計釣果"
                value={`${summary.overview.monthTotalHits}`}
                unit="匹"
              />
            </div>

            {/* TOP3エリア・スポット */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">エリアTOP3</h3>
                </CardHeader>
                <CardContent>
                  {summary.topAreas.length === 0 ? (
                    <p className="text-gray-500 text-sm">データがありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {summary.topAreas.map((item, i) => (
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
                  <h3 className="text-lg font-semibold">スポットTOP3</h3>
                </CardHeader>
                <CardContent>
                  {summary.topSpots.length === 0 ? (
                    <p className="text-gray-500 text-sm">データがありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {summary.topSpots.map((item, i) => (
                        <li
                          key={`${item.area}-${item.spotName}`}
                          className="flex justify-between items-center gap-2"
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-lg font-bold text-brand-primary flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="truncate" title={`${item.area} ${item.spotName}`}>
                              {item.spotName || item.area}
                            </span>
                          </span>
                          <span className="font-semibold whitespace-nowrap flex-shrink-0">
                            {item.hitCount}匹
                            {item.visitCount !== undefined && (
                              <span className="text-gray-500 text-sm ml-1">
                                ({item.visitCount}回)
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

            {/* ルアーTOP3・ルアー別ヒット数 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">ルアーTOP3</h3>
                </CardHeader>
                <CardContent>
                  {summary.topLures.length === 0 ? (
                    <p className="text-gray-500 text-sm">データがありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {summary.topLures.map((item, i) => (
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

              {/* ルアー別ヒット数（上位3・全期間固定） */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">ルアー別ヒット数</h3>
                </CardHeader>
                <CardContent>
                  <LureBarChart data={summary.lureHitsTop} />
                </CardContent>
              </Card>
            </div>

            {/* Pro領域: ヒートマップ */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">時間帯×ヒット数ヒートマップ</h3>
              </CardHeader>
              <CardContent>
                {canUseAdvanced && (
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-700">期間:</span>
                    <div className="w-44">
                      <Select
                        value={advancedRange}
                        onChange={(v) => {
                          if (isDashboardAdvancedRange(v)) {
                            setAdvancedRange(v);
                          }
                        }}
                        options={ADVANCED_RANGE_OPTIONS}
                        placeholder="期間を選択"
                      />
                    </div>
                  </div>
                )}

                {!canUseAdvanced && (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                      Proにアップグレードすると、期間別の傾向や詳細な分析が確認できます
                    </p>
                    <Link href="/settings/billing" className="text-brand-primary font-semibold">
                      Proで詳細を見る
                    </Link>
                  </div>
                )}

                {canUseAdvanced && advancedLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                  </div>
                )}

                {canUseAdvanced && advancedError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                    {advancedError}
                  </div>
                )}

                {canUseAdvanced && !advancedLoading && !advancedError && advanced && (
                  <HeatmapChart data={advanced.heatmap} />
                )}
              </CardContent>
            </Card>

            {/* Pro領域: サイズ分布 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">サイズ分布</h3>
              </CardHeader>
              <CardContent>
                {!canUseAdvanced && (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm">
                      Proにアップグレードすると、期間別の傾向や詳細な分析が確認できます
                    </p>
                    <Link href="/settings/billing" className="text-brand-primary font-semibold">
                      Proで詳細を見る
                    </Link>
                  </div>
                )}

                {canUseAdvanced && advancedLoading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                  </div>
                )}

                {canUseAdvanced && advancedError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                    {advancedError}
                  </div>
                )}

                {canUseAdvanced && !advancedLoading && !advancedError && advanced && (
                  <SizeHistogram
                    data={advanced.sizeHist}
                    unknownCount={advanced.sizeUnknownCount}
                  />
                )}
              </CardContent>
            </Card>

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
