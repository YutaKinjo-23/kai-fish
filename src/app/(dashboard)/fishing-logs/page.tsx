'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FishingLogTable } from './_components/FishingLogTable';
import { FishingLogFilters } from './_components/FishingLogFilters';
import { FishingLogFormModal } from './_components/FishingLogFormModal';
import type {
  FishingLogSummary,
  FishingLogFilter,
  FishingLogSort,
  FishingLogFormData,
  FishingLogData,
} from '@/types/fishing-log';

interface UserData {
  areas?: string[];
  targets?: string[];
  spots?: string[];
}

export default function FishingLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<FishingLogSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FishingLogFilter>({});
  const [sort, setSort] = useState<FishingLogSort>({ key: 'date', order: 'desc' });
  const [userData, setUserData] = useState<UserData>({});

  // モーダル状態
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingLog, setEditingLog] = useState<FishingLogFormData | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);

  // ユーザー情報取得
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserData({
            areas: data.user?.areas || [],
            targets: data.user?.targets || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
    fetchUser();
  }, []);

  // データ取得
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.set('dateTo', filter.dateTo);
      if (filter.area) params.set('area', filter.area);
      if (filter.spot) params.set('spot', filter.spot);
      if (filter.mainTarget) params.set('mainTarget', filter.mainTarget);
      params.set('sortKey', sort.key);
      params.set('sortOrder', sort.order);

      const res = await fetch(`/api/fishing-logs?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('データの取得に失敗しました');
      }
      const data = await res.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, sort, router]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 新規作成
  const handleCreate = () => {
    setFormMode('create');
    setEditingLog(undefined);
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  // 編集
  const handleEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/fishing-logs/${id}`);
      if (!res.ok) throw new Error('データの取得に失敗しました');
      const data: { log: FishingLogData } = await res.json();
      const log = data.log;

      setFormMode('edit');
      setEditingId(id);
      setEditingLog({
        date: log.date,
        memo: log.memo,
        events: log.events.map((e) => {
          const base = { id: e.id, time: e.time, order: e.order };
          switch (e.type) {
            case 'start':
              return { ...base, type: 'start' as const };
            case 'end':
              return { ...base, type: 'end' as const };
            case 'spot':
              return {
                ...base,
                type: 'spot' as const,
                area: e.area || '',
                spotName: e.spotName || '',
              };
            case 'setup':
              return {
                ...base,
                type: 'setup' as const,
                target: e.target,
                tackle: e.tackle,
                rig: e.rig,
              };
            case 'catch':
              return {
                ...base,
                type: 'catch' as const,
                speciesId: e.speciesId || '',
                sizeCm: e.sizeCm,
                photoUrl: e.photoUrl,
              };
            default:
              return { ...base, type: 'start' as const };
          }
        }),
      });
      setIsFormModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch log:', error);
      alert('データの取得に失敗しました');
    }
  };

  // 保存
  const handleSubmit = async (data: FishingLogFormData) => {
    const url = editingId ? `/api/fishing-logs/${editingId}` : '/api/fishing-logs';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || '保存に失敗しました');
    }

    await fetchLogs();
  };

  // 削除実行
  const handleDelete = async () => {
    if (!editingId) return;

    try {
      const res = await fetch(`/api/fishing-logs/${editingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('削除に失敗しました');

      setIsFormModalOpen(false);
      setEditingId(null);
      await fetchLogs();
    } catch (error) {
      console.error('Failed to delete log:', error);
      alert('削除に失敗しました');
    }
  };

  // 行クリックで編集

  // ログからユニークなスポット一覧を抽出
  const uniqueSpots = [...new Set(logs.map((log) => log.spotName).filter((s): s is string => !!s))];

  return (
    <AppLayout pageTitle="釣行記録">
      <FishingLogFilters
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
        userAreas={userData.areas}
        userSpots={uniqueSpots}
      />

      <Card>
        <CardHeader>
          <h2>釣行記録一覧</h2>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-1" />
            新規追加
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : (
            <FishingLogTable logs={logs} onRowClick={handleEdit} />
          )}
        </CardContent>
      </Card>

      <FishingLogFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        initialData={editingLog}
        mode={formMode}
        userAreas={userData.areas}
      />
    </AppLayout>
  );
}
