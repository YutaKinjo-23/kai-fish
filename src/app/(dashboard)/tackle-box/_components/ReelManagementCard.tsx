'use client';

import { useState } from 'react';
import { Plus, Loader2, Trash2, Copy } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Reel, ReelFormData } from '@/types/tackle';

// ギア比定数
const GEAR_RATIO_OPTIONS = [
  { value: 'PG', label: 'PG（パワーギア）' },
  { value: 'normal', label: 'ノーマル' },
  { value: 'HG', label: 'HG（ハイギア）' },
  { value: 'XG', label: 'XG（エクストラハイギア）' },
];

interface ReelManagementCardProps {
  reels: Reel[];
  onAddReel: (data: ReelFormData) => Promise<void>;
  onUpdateReel: (id: string, data: ReelFormData) => Promise<void>;
  onDeleteReel: (id: string) => Promise<void>;
  isLoading: boolean;
}

const EMPTY_REEL_FORM: ReelFormData = {
  name: '',
  maker: '',
  size: '',
  spoolDepth: '',
  gearRatio: '',
  weight: '',
  spoolVariations: '',
};

export function ReelManagementCard({
  reels,
  onAddReel,
  onUpdateReel,
  onDeleteReel,
  isLoading,
}: ReelManagementCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reelForm, setReelForm] = useState<ReelFormData>(EMPTY_REEL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reelForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateReel(editingId, reelForm);
      } else {
        await onAddReel(reelForm);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReelForm(EMPTY_REEL_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (reel: Reel) => {
    setReelForm({
      name: reel.name,
      maker: reel.maker || '',
      size: reel.size || '',
      spoolDepth: reel.spoolDepth || '',
      gearRatio: reel.gearRatio || '',
      weight: reel.weight?.toString() || '',
      spoolVariations: reel.spoolVariations || '',
    });
    setEditingId(reel.id);
    setIsFormOpen(true);
  };

  const handleCopy = (reel: Reel) => {
    setReelForm({
      name: reel.name,
      maker: reel.maker || '',
      size: reel.size || '',
      spoolDepth: reel.spoolDepth || '',
      gearRatio: reel.gearRatio || '',
      weight: reel.weight?.toString() || '',
      spoolVariations: reel.spoolVariations || '',
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <h2>リール管理</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (isFormOpen && !editingId) {
              resetForm();
            } else {
              setEditingId(null);
              setReelForm(EMPTY_REEL_FORM);
              setIsFormOpen(true);
            }
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          追加
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* 追加・編集フォーム */}
            {isFormOpen && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                {editingId && <p className="text-sm font-medium text-brand-primary">編集中</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      モデル名 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例: レガリスLT2500S-XH"
                      value={reelForm.name}
                      onChange={(e) => setReelForm({ ...reelForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">メーカー</label>
                    <Input
                      placeholder="例: ダイワ"
                      value={reelForm.maker}
                      onChange={(e) => setReelForm({ ...reelForm, maker: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">番手</label>
                    <Input
                      placeholder="例: 2500S"
                      value={reelForm.size}
                      onChange={(e) => setReelForm({ ...reelForm, size: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ギア比</label>
                    <Select
                      value={reelForm.gearRatio}
                      onChange={(value) => setReelForm({ ...reelForm, gearRatio: value })}
                      options={GEAR_RATIO_OPTIONS}
                      placeholder="選択"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      スプール深さ
                    </label>
                    <Input
                      placeholder="例: シャロー"
                      value={reelForm.spoolDepth}
                      onChange={(e) => setReelForm({ ...reelForm, spoolDepth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">自重 (g)</label>
                    <Input
                      placeholder="例: 200"
                      value={reelForm.weight}
                      onChange={(e) => setReelForm({ ...reelForm, weight: e.target.value })}
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    替えスプール
                  </label>
                  <Input
                    placeholder="例: PE0.6 / PE0.8"
                    value={reelForm.spoolVariations}
                    onChange={(e) => setReelForm({ ...reelForm, spoolVariations: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  ※ モデル名が不明な場合は「2500番スピニング」「ベイトリール」などでもOK
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !reelForm.name.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingId ? (
                      '更新'
                    ) : (
                      '追加'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* リール一覧 */}
            {reels.length === 0 ? (
              <p className="text-center text-gray-500 py-4">まだリールが登録されていません</p>
            ) : (
              <div className="space-y-2">
                {reels.map((reel) => (
                  <ReelItem
                    key={reel.id}
                    reel={reel}
                    onEdit={() => handleEdit(reel)}
                    onCopy={() => handleCopy(reel)}
                    onDelete={() => onDeleteReel(reel.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// リールアイテムコンポーネント
function ReelItem({
  reel,
  onEdit,
  onCopy,
  onDelete,
}: {
  reel: Reel;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-gray-900">
            {reel.maker && <span className="text-gray-500">{reel.maker} </span>}
            {reel.name}
          </div>
          <div className="text-gray-500 text-xs mt-1 space-x-2">
            {reel.size && <span>{reel.size}</span>}
            {reel.gearRatio && <span>{reel.gearRatio}</span>}
            {reel.weight && <span>{reel.weight}g</span>}
            {reel.spoolDepth && <span>スプール: {reel.spoolDepth}</span>}
          </div>
          {reel.spoolVariations && (
            <p className="text-gray-400 text-xs mt-1">替えスプール: {reel.spoolVariations}</p>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onCopy}
            className="p-1 text-gray-400 hover:text-brand-primary rounded transition-colors"
            title="コピーして新規作成"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
