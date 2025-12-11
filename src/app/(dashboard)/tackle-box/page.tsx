'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, Package } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TackleSetFormModal } from './_components/TackleSetFormModal';
import { TackleSetCard } from './_components/TackleSetCard';
import { DeleteConfirmModal } from './_components/DeleteConfirmModal';
import { RodManagementCard } from './_components/RodManagementCard';
import { ReelManagementCard } from './_components/ReelManagementCard';
import { LineManagementCard } from './_components/LineManagementCard';
import { LureManagementCard } from './_components/LureManagementCard';
import { TerminalTackleManagementCard } from './_components/TerminalTackleManagementCard';
import type {
  TackleSet,
  TackleSetFormData,
  Rod,
  Reel,
  Line,
  Lure,
  TerminalTackle,
  RodFormData,
  ReelFormData,
  LineFormData,
  LureFormData,
  TerminalTackleFormData,
} from '@/types/tackle';

export default function TackleBoxPage() {
  const [tackleSets, setTackleSets] = useState<TackleSet[]>([]);
  const [rods, setRods] = useState<Rod[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [lures, setLures] = useState<Lure[]>([]);
  const [terminalTackles, setTerminalTackles] = useState<TerminalTackle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<TackleSet | null>(null);
  const [deletingSet, setDeletingSet] = useState<TackleSet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      const [setsRes, rodsRes, reelsRes, linesRes, luresRes, terminalTacklesRes] =
        await Promise.all([
          fetch('/api/tackle/sets'),
          fetch('/api/tackle/rods'),
          fetch('/api/tackle/reels'),
          fetch('/api/tackle/lines'),
          fetch('/api/tackle/lures'),
          fetch('/api/tackle/terminal-tackles'),
        ]);

      if (setsRes.ok) {
        const data = await setsRes.json();
        setTackleSets(data.tackleSets);
      }
      if (rodsRes.ok) {
        const data = await rodsRes.json();
        setRods(data.rods);
      }
      if (reelsRes.ok) {
        const data = await reelsRes.json();
        setReels(data.reels);
      }
      if (linesRes.ok) {
        const data = await linesRes.json();
        setLines(data.lines);
      }
      if (luresRes.ok) {
        const data = await luresRes.json();
        setLures(data.lures);
      }
      if (terminalTacklesRes.ok) {
        const data = await terminalTacklesRes.json();
        setTerminalTackles(data.terminalTackles);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // タックルセット作成・更新
  const handleSubmit = async (data: TackleSetFormData) => {
    const url = editingSet ? `/api/tackle/sets/${editingSet.id}` : '/api/tackle/sets';
    const method = editingSet ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      await fetchData();
      setEditingSet(null);
    }
  };

  // タックルセット削除
  const handleDelete = async () => {
    if (!deletingSet) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tackle/sets/${deletingSet.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchData();
      }
    } finally {
      setIsDeleting(false);
      setDeletingSet(null);
    }
  };

  // ロッド追加
  const handleAddRod = async (data: RodFormData) => {
    const res = await fetch('/api/tackle/rods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setRods((prev) => [result.rod, ...prev]);
    }
  };

  // ロッド更新
  const handleUpdateRod = async (id: string, data: RodFormData) => {
    const res = await fetch(`/api/tackle/rods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setRods((prev) => prev.map((r) => (r.id === id ? result.rod : r)));
    }
  };

  // リール追加
  const handleAddReel = async (data: ReelFormData) => {
    const res = await fetch('/api/tackle/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setReels((prev) => [result.reel, ...prev]);
    }
  };

  // リール更新
  const handleUpdateReel = async (id: string, data: ReelFormData) => {
    const res = await fetch(`/api/tackle/reels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setReels((prev) => prev.map((r) => (r.id === id ? result.reel : r)));
    }
  };

  // ライン追加
  const handleAddLine = async (data: LineFormData) => {
    const res = await fetch('/api/tackle/lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setLines((prev) => [result.line, ...prev]);
    }
  };

  // ロッド削除
  const handleDeleteRod = async (id: string) => {
    const res = await fetch(`/api/tackle/rods/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setRods((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // リール削除
  const handleDeleteReel = async (id: string) => {
    const res = await fetch(`/api/tackle/reels/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setReels((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // ライン削除
  const handleDeleteLine = async (id: string) => {
    const res = await fetch(`/api/tackle/lines/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setLines((prev) => prev.filter((l) => l.id !== id));
    }
  };

  // ライン更新
  const handleUpdateLine = async (id: string, data: LineFormData) => {
    const res = await fetch(`/api/tackle/lines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setLines((prev) => prev.map((l) => (l.id === id ? result.line : l)));
    }
  };

  // ルアー追加
  const handleAddLure = async (data: LureFormData) => {
    const res = await fetch('/api/tackle/lures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setLures((prev) => [result.lure, ...prev]);
    }
  };

  // ルアー削除
  const handleDeleteLure = async (id: string) => {
    const res = await fetch(`/api/tackle/lures/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setLures((prev) => prev.filter((l) => l.id !== id));
    }
  };

  // ルアー更新
  const handleUpdateLure = async (id: string, data: LureFormData) => {
    const res = await fetch(`/api/tackle/lures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setLures((prev) => prev.map((l) => (l.id === id ? result.lure : l)));
    }
  };

  // 小物追加
  const handleAddTerminalTackle = async (data: TerminalTackleFormData) => {
    const res = await fetch('/api/tackle/terminal-tackles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setTerminalTackles((prev) => [result.terminalTackle, ...prev]);
    }
  };

  // 小物更新
  const handleUpdateTerminalTackle = async (id: string, data: TerminalTackleFormData) => {
    const res = await fetch(`/api/tackle/terminal-tackles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      setTerminalTackles((prev) => prev.map((t) => (t.id === id ? result.terminalTackle : t)));
    }
  };

  // 小物削除
  const handleDeleteTerminalTackle = async (id: string) => {
    const res = await fetch(`/api/tackle/terminal-tackles/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setTerminalTackles((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const openCreateModal = () => {
    setEditingSet(null);
    setIsModalOpen(true);
  };

  const openEditModal = (set: TackleSet) => {
    setEditingSet(set);
    setIsModalOpen(true);
  };

  return (
    <AppLayout pageTitle="タックルボックス">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2>タックルセット一覧</h2>
            <Button size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1" />
              新規追加
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : tackleSets.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">まだタックルセットが登録されていません。</p>
                <Button size="sm" onClick={openCreateModal}>
                  <Plus className="w-4 h-4 mr-1" />
                  最初のセットを作成
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tackleSets.map((set) => (
                  <TackleSetCard
                    key={set.id}
                    tackleSet={set}
                    onEdit={() => openEditModal(set)}
                    onDelete={() => setDeletingSet(set)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ロッド管理 */}
        <div id="rod-management">
          <RodManagementCard
            rods={rods}
            onAddRod={handleAddRod}
            onUpdateRod={handleUpdateRod}
            onDeleteRod={handleDeleteRod}
            isLoading={isLoading}
          />
        </div>

        {/* リール管理 */}
        <div id="reel-management">
          <ReelManagementCard
            reels={reels}
            onAddReel={handleAddReel}
            onUpdateReel={handleUpdateReel}
            onDeleteReel={handleDeleteReel}
            isLoading={isLoading}
          />
        </div>

        {/* ライン管理 */}
        <div id="line-management">
          <LineManagementCard
            lines={lines}
            reels={reels}
            onAddLine={handleAddLine}
            onUpdateLine={handleUpdateLine}
            onDeleteLine={handleDeleteLine}
            isLoading={isLoading}
          />
        </div>

        {/* ルアー・ワーム管理 */}
        <LureManagementCard
          lures={lures}
          onAddLure={handleAddLure}
          onUpdateLure={handleUpdateLure}
          onDeleteLure={handleDeleteLure}
          isLoading={isLoading}
        />

        {/* 小物管理 */}
        <TerminalTackleManagementCard
          terminalTackles={terminalTackles}
          onAddTerminalTackle={handleAddTerminalTackle}
          onUpdateTerminalTackle={handleUpdateTerminalTackle}
          onDeleteTerminalTackle={handleDeleteTerminalTackle}
          isLoading={isLoading}
        />

        {/* フォームモーダル */}
        <TackleSetFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSet(null);
          }}
          onSubmit={handleSubmit}
          editData={editingSet}
          rods={rods}
          reels={reels}
          lines={lines}
          tackleSets={tackleSets}
          onNavigateToTab={(tab: 'rod' | 'reel' | 'line') => {
            const elementId = `${tab}-management`;
            const element = document.getElementById(elementId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />

        {/* 削除確認モーダル */}
        <DeleteConfirmModal
          isOpen={!!deletingSet}
          onClose={() => setDeletingSet(null)}
          onConfirm={handleDelete}
          title="タックルセットを削除"
          message={`「${deletingSet?.name}」を削除しますか？この操作は取り消せません。`}
          isDeleting={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
