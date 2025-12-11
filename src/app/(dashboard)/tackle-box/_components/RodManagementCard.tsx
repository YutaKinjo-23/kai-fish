'use client';

import { useState } from 'react';
import { Plus, Loader2, Trash2, Copy } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Rod, RodFormData } from '@/types/tackle';

// ロッドパワー定数
const ROD_POWER_OPTIONS = [
  { value: 'UL', label: 'UL（ウルトラライト）' },
  { value: 'L', label: 'L（ライト）' },
  { value: 'ML', label: 'ML（ミディアムライト）' },
  { value: 'M', label: 'M（ミディアム）' },
  { value: 'MH', label: 'MH（ミディアムヘビー）' },
  { value: 'H', label: 'H（ヘビー）' },
  { value: 'XH', label: 'XH（エクストラヘビー）' },
];

interface RodManagementCardProps {
  rods: Rod[];
  onAddRod: (data: RodFormData) => Promise<void>;
  onUpdateRod: (id: string, data: RodFormData) => Promise<void>;
  onDeleteRod: (id: string) => Promise<void>;
  isLoading: boolean;
}

const EMPTY_ROD_FORM: RodFormData = {
  name: '',
  maker: '',
  lengthFt: '',
  power: '',
  lureWeightMin: '',
  lureWeightMax: '',
  egiSizeMin: '',
  egiSizeMax: '',
  lineMin: '',
  lineMax: '',
  memo: '',
};

export function RodManagementCard({
  rods,
  onAddRod,
  onUpdateRod,
  onDeleteRod,
  isLoading,
}: RodManagementCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rodForm, setRodForm] = useState<RodFormData>(EMPTY_ROD_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rodForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateRod(editingId, rodForm);
      } else {
        await onAddRod(rodForm);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRodForm(EMPTY_ROD_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (rod: Rod) => {
    setRodForm({
      name: rod.name,
      maker: rod.maker || '',
      lengthFt: rod.lengthFt || '',
      power: rod.power || '',
      lureWeightMin: rod.lureWeightMin?.toString() || '',
      lureWeightMax: rod.lureWeightMax?.toString() || '',
      egiSizeMin: rod.egiSizeMin || '',
      egiSizeMax: rod.egiSizeMax || '',
      lineMin: rod.lineMin || '',
      lineMax: rod.lineMax || '',
      memo: rod.memo || '',
    });
    setEditingId(rod.id);
    setIsFormOpen(true);
  };

  const handleCopy = (rod: Rod) => {
    setRodForm({
      name: rod.name,
      maker: rod.maker || '',
      lengthFt: rod.lengthFt || '',
      power: rod.power || '',
      lureWeightMin: rod.lureWeightMin?.toString() || '',
      lureWeightMax: rod.lureWeightMax?.toString() || '',
      egiSizeMin: rod.egiSizeMin || '',
      egiSizeMax: rod.egiSizeMax || '',
      lineMin: rod.lineMin || '',
      lineMax: rod.lineMax || '',
      memo: rod.memo || '',
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <h2>ロッド管理</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (isFormOpen && !editingId) {
              resetForm();
            } else {
              setEditingId(null);
              setRodForm(EMPTY_ROD_FORM);
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
                      placeholder="例: 月下美人76L-T"
                      value={rodForm.name}
                      onChange={(e) => setRodForm({ ...rodForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">メーカー</label>
                    <Input
                      placeholder="例: ダイワ"
                      value={rodForm.maker}
                      onChange={(e) => setRodForm({ ...rodForm, maker: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">長さ</label>
                    <Input
                      placeholder="例: 7'6&quot;"
                      value={rodForm.lengthFt}
                      onChange={(e) => setRodForm({ ...rodForm, lengthFt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">パワー</label>
                    <Select
                      value={rodForm.power}
                      onChange={(value) => setRodForm({ ...rodForm, power: value })}
                      options={ROD_POWER_OPTIONS}
                      placeholder="選択"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      適合ルアー下限 (g)
                    </label>
                    <Input
                      placeholder="例: 0.5"
                      value={rodForm.lureWeightMin}
                      onChange={(e) => setRodForm({ ...rodForm, lureWeightMin: e.target.value })}
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      適合ルアー上限 (g)
                    </label>
                    <Input
                      placeholder="例: 8"
                      value={rodForm.lureWeightMax}
                      onChange={(e) => setRodForm({ ...rodForm, lureWeightMax: e.target.value })}
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      適合エギ下限 (号)
                    </label>
                    <Input
                      placeholder="例: 2.5"
                      value={rodForm.egiSizeMin}
                      onChange={(e) => setRodForm({ ...rodForm, egiSizeMin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      適合エギ上限 (号)
                    </label>
                    <Input
                      placeholder="例: 3.5"
                      value={rodForm.egiSizeMax}
                      onChange={(e) => setRodForm({ ...rodForm, egiSizeMax: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      適合ライン下限
                    </label>
                    <Input
                      placeholder="例: PE0.4"
                      value={rodForm.lineMin}
                      onChange={(e) => setRodForm({ ...rodForm, lineMin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      適合ライン上限
                    </label>
                    <Input
                      placeholder="例: PE1.0"
                      value={rodForm.lineMax}
                      onChange={(e) => setRodForm({ ...rodForm, lineMax: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                  <Input
                    placeholder="任意"
                    value={rodForm.memo}
                    onChange={(e) => setRodForm({ ...rodForm, memo: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  ※ モデル名が不明な場合は「シーバスロッド」「エギングロッド」などでもOK
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !rodForm.name.trim()}
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

            {/* ロッド一覧 */}
            {rods.length === 0 ? (
              <p className="text-center text-gray-500 py-4">まだロッドが登録されていません</p>
            ) : (
              <div className="space-y-2">
                {rods.map((rod) => (
                  <RodItem
                    key={rod.id}
                    rod={rod}
                    onEdit={() => handleEdit(rod)}
                    onCopy={() => handleCopy(rod)}
                    onDelete={() => onDeleteRod(rod.id)}
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

// ロッドアイテムコンポーネント
function RodItem({
  rod,
  onEdit,
  onCopy,
  onDelete,
}: {
  rod: Rod;
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
            {rod.maker && <span className="text-gray-500">{rod.maker} </span>}
            {rod.name}
          </div>
          <div className="text-gray-500 text-xs mt-1 space-x-2">
            {rod.lengthFt && <span>{rod.lengthFt}</span>}
            {rod.power && <span>{rod.power}</span>}
            {(rod.lureWeightMin || rod.lureWeightMax) && (
              <span>
                ルアー: {rod.lureWeightMin || '?'}〜{rod.lureWeightMax || '?'}g
              </span>
            )}
            {(rod.egiSizeMin || rod.egiSizeMax) && (
              <span>
                エギ: {rod.egiSizeMin || '?'}〜{rod.egiSizeMax || '?'}号
              </span>
            )}
            {(rod.lineMin || rod.lineMax) && (
              <span>
                ライン: {rod.lineMin || '?'}〜{rod.lineMax || '?'}
              </span>
            )}
          </div>
          {rod.memo && <p className="text-gray-400 text-xs mt-1">{rod.memo}</p>}
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
