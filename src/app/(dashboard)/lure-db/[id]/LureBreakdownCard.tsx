'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchJson, PlanForbiddenError } from '@/lib/api/client';
import { usePlanGateModal } from '@/features/plan/PlanGateModalContext';

interface BreakdownData {
  lureId: string;
  byTimeOfDay: { hour: number; hits: number }[];
  byTide: { tide: string; hits: number }[];
  bySpot: { spotId: string; hits: number }[];
  byRig: { rigId: string; hits: number }[];
}

export function LureBreakdownCard({ lureId }: { lureId: string }) {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const { open } = usePlanGateModal();

  useEffect(() => {
    setLoading(true);
    fetchJson<BreakdownData>(`/api/lures/${lureId}/breakdown`)
      .then(setData)
      .catch((e) => {
        if (e instanceof PlanForbiddenError) {
          setIsForbidden(true);
        } else {
          console.error(e);
        }
      })
      .finally(() => setLoading(false));
  }, [lureId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-bold text-lg">条件別内訳</h3>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isForbidden) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-bold text-lg">条件別内訳</h3>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="mb-4 text-gray-600">
            Proプランにアップグレードすると、
            <br />
            時間帯・潮汐・スポット・リグ別の釣果内訳が見られます。
          </p>
          <Button onClick={() => open({ featureKey: 'lures.breakdown' })}>
            Proプラン詳細を見る
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const maxHits = Math.max(...data.byTimeOfDay.map((x) => x.hits), 1);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-lg">条件別内訳</h3>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* 時間帯別 */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700">時間帯別</h4>
          <div className="flex items-end h-24 gap-1 border-b border-gray-200 pb-1">
            {data.byTimeOfDay.map((d) => (
              <div
                key={d.hour}
                className="flex-1 bg-brand-primary rounded-t transition-all"
                style={{
                  height: `${(d.hits / maxHits) * 100}%`,
                  opacity: d.hits > 0 ? 1 : 0.2,
                }}
                title={`${d.hour}時: ${d.hits}匹`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>23</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* スポット別 */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-700">スポット別 (TOP10)</h4>
            <ul className="space-y-2 text-sm">
              {data.bySpot.length === 0 && <li className="text-gray-500">データなし</li>}
              {data.bySpot.map((d) => (
                <li key={d.spotId} className="flex justify-between items-center">
                  <span className="truncate mr-2 text-gray-600" title={d.spotId}>
                    {d.spotId}
                  </span>
                  <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {d.hits}匹
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* リグ別 */}
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-700">リグ別 (TOP10)</h4>
            <ul className="space-y-2 text-sm">
              {data.byRig.length === 0 && <li className="text-gray-500">データなし</li>}
              {data.byRig.map((d) => (
                <li key={d.rigId} className="flex justify-between items-center">
                  <span className="truncate mr-2 text-gray-600" title={d.rigId}>
                    {d.rigId}
                  </span>
                  <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {d.hits}匹
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
