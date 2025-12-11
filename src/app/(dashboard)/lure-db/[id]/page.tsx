'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SEASONS, TIDES, TIME_ZONES, WATER_QUALITIES } from '../_lib/lure-conditions';
import type { Lure } from '@/types/tackle';

interface LureDetailResponse {
  lure: Lure;
  stats?: {
    hitCount: number;
    avgSizeCm: number | null;
    mostUsedRig: string | null;
  };
}

export default function LureDBDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lure, setLure] = useState<Lure | null>(null);
  const [stats, setStats] = useState<LureDetailResponse['stats']>();

  const [rating, setRating] = useState('');
  const [conditionMemo, setConditionMemo] = useState('');
  const [recommendedSinkerWeight, setRecommendedSinkerWeight] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [areas, setAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState('');

  const [timeZones, setTimeZones] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [tides, setTides] = useState<string[]>([]);
  const [waterQualities, setWaterQualities] = useState<string[]>([]);

  const [rigExamples, setRigExamples] = useState<string[]>([]);
  const [newRigExample, setNewRigExample] = useState('');

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tackle/lures/${id}`);
        if (!res.ok) {
          router.push('/lure-db');
          return;
        }
        const data: LureDetailResponse = await res.json();
        setLure(data.lure);
        setStats(data.stats);
        setRating(data.lure.rating ? String(data.lure.rating) : '');
        setConditionMemo(data.lure.conditionMemo || '');
        setRecommendedSinkerWeight(data.lure.recommendedSinkerWeight || '');
        setImageUrl(data.lure.imageUrl || '');
        setAreas(data.lure.areas || []);
        setTimeZones(data.lure.timeZones || []);
        setSeasons(data.lure.seasons || []);
        setTides(data.lure.tides || []);
        setWaterQualities(data.lure.waterQualities || []);
        setRigExamples(data.lure.rigExamples || []);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetail();
  }, [id, router]);

  const toggleValue = (values: string[], value: string) => {
    return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
  };

  const ratingOptions = useMemo(() => {
    return [
      { value: '', label: '未設定' },
      { value: '1', label: '★1' },
      { value: '2', label: '★2' },
      { value: '3', label: '★3' },
      { value: '4', label: '★4' },
      { value: '5', label: '★5' },
    ];
  }, []);

  const handleSave = async () => {
    if (!lure) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tackle/lures/${lure.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lureType: lure.lureType,
          maker: lure.maker,
          name: lure.name,
          color: lure.color,
          size: lure.size,
          recommendedHook: lure.recommendedHook,
          recommendedRig: lure.recommendedRig ? lure.recommendedRig.split(',') : [],
          memo: lure.memo,
          stockQty: lure.stockQty,
          needRestock: lure.needRestock,
          imageUrl,
          recommendedSinkerWeight,
          rating: rating ? parseInt(rating, 10) : null,
          conditionMemo,
          rigExamples,
          areas,
          timeZones,
          seasons,
          tides,
          waterQualities,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLure(updated.lure);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout pageTitle="ルアー詳細">
        <Card>
          <CardContent>
            <p className="text-gray-500">読み込み中...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (!lure) {
    return (
      <AppLayout pageTitle="ルアー詳細">
        <Card>
          <CardContent>
            <p className="text-gray-500">ルアーが見つかりません。</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="ルアー詳細">
      <Card>
        <CardHeader>
          <h2>{lure.name}</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push('/lure-db')}>
              一覧へ
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                {lure.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lure.imageUrl} alt={lure.name} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-700">種類: {lure.lureType}</p>
                <p className="text-sm text-gray-700">メーカー: {lure.maker || '-'}</p>
                <p className="text-sm text-gray-700">カラー: {lure.color || '-'}</p>
                <p className="text-sm text-gray-700">サイズ: {lure.size || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">画像URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">参考評価</label>
                <Select
                  value={rating}
                  onChange={(value) => setRating(value)}
                  options={ratingOptions}
                  placeholder="未設定"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  推奨シンカー重量
                </label>
                <Input
                  value={recommendedSinkerWeight}
                  onChange={(e) => setRecommendedSinkerWeight(e.target.value)}
                  placeholder="例: 5〜7g"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">推奨フック</label>
                <Input value={lure.recommendedHook || ''} disabled />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">自分の釣行での実績</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">ヒット回数</p>
                  <p className="text-sm font-medium text-gray-900">{stats?.hitCount ?? 0}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">平均サイズ</p>
                  <p className="text-sm font-medium text-gray-900">
                    {stats?.avgSizeCm != null ? `${stats.avgSizeCm.toFixed(1)}cm` : '-'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">よく使用したリグ</p>
                  <p className="text-sm font-medium text-gray-900">{stats?.mostUsedRig || '-'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ※釣行記録の「釣果」イベントでルアーを選択した場合に集計されます。
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">コンディション</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">エリア</label>
                  <div className="flex gap-2">
                    <Input
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      placeholder="例: 西浦"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const trimmed = newArea.trim();
                        if (!trimmed) return;
                        if (!areas.includes(trimmed)) setAreas((prev) => [...prev, trimmed]);
                        setNewArea('');
                      }}
                    >
                      追加
                    </Button>
                  </div>
                  {areas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {areas.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className="px-2 py-1 text-xs rounded-full border bg-white text-gray-600 border-gray-300 hover:border-brand-primary"
                          onClick={() => setAreas((prev) => prev.filter((v) => v !== a))}
                          title="クリックで削除"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">時間帯</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_ZONES.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setTimeZones((prev) => toggleValue(prev, o.value))}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          timeZones.includes(o.value)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">季節</label>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setSeasons((prev) => toggleValue(prev, o.value))}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          seasons.includes(o.value)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">潮</label>
                  <div className="flex flex-wrap gap-2">
                    {TIDES.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setTides((prev) => toggleValue(prev, o.value))}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          tides.includes(o.value)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">水質</label>
                  <div className="flex flex-wrap gap-2">
                    {WATER_QUALITIES.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setWaterQualities((prev) => toggleValue(prev, o.value))}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          waterQualities.includes(o.value)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">条件メモ</label>
                  <Input
                    value={conditionMemo}
                    onChange={(e) => setConditionMemo(e.target.value)}
                    placeholder="例: 常夜灯なし / やや濁り / 下げ止まり前後で反応が出やすい"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">リグ構成例</label>
                  <div className="flex gap-2">
                    <Input
                      value={newRigExample}
                      onChange={(e) => setNewRigExample(e.target.value)}
                      placeholder="例: フリーリグ5〜7g＋オフセット#1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const trimmed = newRigExample.trim();
                        if (!trimmed) return;
                        if (!rigExamples.includes(trimmed))
                          setRigExamples((prev) => [...prev, trimmed]);
                        setNewRigExample('');
                      }}
                    >
                      追加
                    </Button>
                  </div>
                  {rigExamples.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rigExamples.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          className="px-2 py-1 text-xs rounded-full border bg-white text-gray-600 border-gray-300 hover:border-brand-primary"
                          onClick={() => setRigExamples((prev) => prev.filter((v) => v !== ex))}
                          title="クリックで削除"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">関連情報</h3>
                  <Button size="sm" variant="outline" onClick={() => router.push('/tackle-box')}>
                    タックルボックスへ
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">近い傾向のルアー</h3>
                  <p className="text-sm text-gray-500">v1では未実装です。</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
