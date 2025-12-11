'use client';

import { useState, useMemo } from 'react';
import { Plus, Loader2, Trash2, AlertTriangle, Copy } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Lure, LureFormData } from '@/types/tackle';
import { LURE_TYPES, RECOMMENDED_RIGS } from '@/types/tackle';

interface LureManagementCardProps {
  lures: Lure[];
  onAddLure: (data: LureFormData) => Promise<void>;
  onUpdateLure: (id: string, data: LureFormData) => Promise<void>;
  onDeleteLure: (id: string) => Promise<void>;
  isLoading: boolean;
}

const EMPTY_LURE_FORM: LureFormData = {
  lureType: '',
  maker: '',
  name: '',
  color: '',
  size: '',
  recommendedHook: '',
  recommendedRig: [],
  memo: '',
  stockQty: '',
  needRestock: false,
};

export function LureManagementCard({
  lures,
  onAddLure,
  onUpdateLure,
  onDeleteLure,
  isLoading,
}: LureManagementCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lureForm, setLureForm] = useState<LureFormData>(EMPTY_LURE_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!lureForm.name.trim() || !lureForm.lureType) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateLure(editingId, lureForm);
      } else {
        await onAddLure(lureForm);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLureForm(EMPTY_LURE_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const toggleRig = (rigValue: string) => {
    setLureForm((prev) => ({
      ...prev,
      recommendedRig: prev.recommendedRig.includes(rigValue)
        ? prev.recommendedRig.filter((r) => r !== rigValue)
        : [...prev.recommendedRig, rigValue],
    }));
  };

  const handleEdit = (lure: Lure) => {
    setLureForm({
      lureType: lure.lureType,
      maker: lure.maker || '',
      name: lure.name,
      color: lure.color || '',
      size: lure.size || '',
      recommendedHook: lure.recommendedHook || '',
      recommendedRig: lure.recommendedRig ? lure.recommendedRig.split(',') : [],
      memo: lure.memo || '',
      stockQty: lure.stockQty?.toString() || '',
      needRestock: lure.needRestock,
    });
    setEditingId(lure.id);
    setIsFormOpen(true);
  };

  // コピー機能：既存ルアーをフォームにセット（カラーは空にする）
  const handleCopy = (lure: Lure) => {
    setLureForm({
      lureType: lure.lureType,
      maker: lure.maker || '',
      name: lure.name,
      color: '', // カラーは空にして入力させる
      size: lure.size || '',
      recommendedHook: lure.recommendedHook || '',
      recommendedRig: lure.recommendedRig ? lure.recommendedRig.split(',') : [],
      memo: lure.memo || '',
      stockQty: '',
      needRestock: false,
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  // 要補充のルアー数
  const needRestockCount = lures.filter((l) => l.needRestock).length;

  // 過去に登録された種類を候補として取得（デフォルト + 過去の入力）
  const lureTypeSuggestions = useMemo(() => {
    const defaultTypes: string[] = LURE_TYPES.map((t) => t.label);
    const usedTypes = lures
      .map((l) => l.lureType)
      .filter((t): t is string => !!t && !defaultTypes.includes(t));
    const uniqueUsedTypes = [...new Set(usedTypes)];
    return [...defaultTypes, ...uniqueUsedTypes];
  }, [lures]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <h2>ルアー・ワーム管理</h2>
          {needRestockCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              要補充 {needRestockCount}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (isFormOpen && !editingId) {
              resetForm();
            } else {
              setEditingId(null);
              setLureForm(EMPTY_LURE_FORM);
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
                      種類 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例: ワーム"
                      value={lureForm.lureType}
                      onChange={(e) => setLureForm({ ...lureForm, lureType: e.target.value })}
                      list="lure-type-suggestions"
                    />
                    <datalist id="lure-type-suggestions">
                      {lureTypeSuggestions.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">メーカー</label>
                    <Input
                      placeholder="例: DAIWA"
                      value={lureForm.maker}
                      onChange={(e) => setLureForm({ ...lureForm, maker: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      製品名 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例: LICKY 3inch"
                      value={lureForm.name}
                      onChange={(e) => setLureForm({ ...lureForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">カラー</label>
                    <Input
                      placeholder="例: アカキン"
                      value={lureForm.color}
                      onChange={(e) => setLureForm({ ...lureForm, color: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      サイズ（inch / g）
                    </label>
                    <Input
                      placeholder="例: 3inch / 7g"
                      value={lureForm.size}
                      onChange={(e) => setLureForm({ ...lureForm, size: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      推奨フックサイズ
                    </label>
                    <Input
                      placeholder="例: オフセット#2"
                      value={lureForm.recommendedHook}
                      onChange={(e) =>
                        setLureForm({ ...lureForm, recommendedHook: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* 推奨リグ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">推奨リグ</label>
                  <div className="flex flex-wrap gap-2">
                    {RECOMMENDED_RIGS.map((rig) => (
                      <button
                        key={rig.value}
                        type="button"
                        onClick={() => toggleRig(rig.value)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          lureForm.recommendedRig.includes(rig.value)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                        }`}
                      >
                        {rig.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 所感メモ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">所感メモ</label>
                  <Input
                    placeholder="例: 夜のカサゴに効く"
                    value={lureForm.memo}
                    onChange={(e) => setLureForm({ ...lureForm, memo: e.target.value })}
                  />
                </div>

                {/* 在庫・状態 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      所持数（ざっくり）
                    </label>
                    <Input
                      placeholder="例: 5"
                      value={lureForm.stockQty}
                      onChange={(e) => setLureForm({ ...lureForm, stockQty: e.target.value })}
                      type="number"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lureForm.needRestock}
                        onChange={(e) =>
                          setLureForm({ ...lureForm, needRestock: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                      要補充
                    </label>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  ※ 製品名が不明な場合は「赤ワーム3inch」「シルバージグ30g」などでもOK
                </p>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !lureForm.name.trim() || !lureForm.lureType}
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

            {/* ルアー一覧 */}
            {lures.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                まだルアー・ワームが登録されていません
              </p>
            ) : (
              <div className="space-y-2">
                {lures.map((lure) => (
                  <LureItem
                    key={lure.id}
                    lure={lure}
                    onEdit={() => handleEdit(lure)}
                    onCopy={() => handleCopy(lure)}
                    onDelete={() => onDeleteLure(lure.id)}
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

// ルアーアイテムコンポーネント
function LureItem({
  lure,
  onEdit,
  onCopy,
  onDelete,
}: {
  lure: Lure;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  // ルアー種別のラベルを取得
  const lureTypeLabel = LURE_TYPES.find((t) => t.value === lure.lureType)?.label || lure.lureType;

  // 推奨リグを取得
  const rigs = lure.recommendedRig
    ? lure.recommendedRig.split(',').map((rigValue) => {
        const rig = RECOMMENDED_RIGS.find((r) => r.value === rigValue);
        return rig?.label || rigValue;
      })
    : [];

  return (
    <div
      onClick={onEdit}
      className={`bg-white border rounded-lg p-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
        lure.needRestock ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">
              {lureTypeLabel}
            </span>
            {lure.needRestock && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                要補充
              </span>
            )}
          </div>
          <div className="font-medium text-gray-900 mt-1">
            {lure.maker && <span className="text-gray-500">{lure.maker} </span>}
            {lure.name}
            {lure.color && <span className="text-gray-500"> / {lure.color}</span>}
          </div>
          <div className="text-gray-500 text-xs mt-1 space-x-2">
            {lure.size && <span>{lure.size}</span>}
            {lure.recommendedHook && <span>フック: {lure.recommendedHook}</span>}
            {lure.stockQty !== null && <span>所持: {lure.stockQty}個</span>}
          </div>
          {rigs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {rigs.map((rig, i) => (
                <span
                  key={i}
                  className="text-xs bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded"
                >
                  {rig}
                </span>
              ))}
            </div>
          )}
          {lure.memo && <p className="text-gray-400 text-xs mt-1">{lure.memo}</p>}
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
