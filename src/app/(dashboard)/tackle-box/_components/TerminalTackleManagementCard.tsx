'use client';

import { useState, useMemo } from 'react';
import { Plus, Loader2, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { TerminalTackle, TerminalTackleFormData } from '@/types/tackle';
import { TERMINAL_TACKLE_CATEGORIES, SINKER_TYPES } from '@/types/tackle';

interface TerminalTackleManagementCardProps {
  terminalTackles: TerminalTackle[];
  onAddTerminalTackle: (data: TerminalTackleFormData) => Promise<void>;
  onUpdateTerminalTackle: (id: string, data: TerminalTackleFormData) => Promise<void>;
  onDeleteTerminalTackle: (id: string) => Promise<void>;
  isLoading: boolean;
}

const EMPTY_FORM: TerminalTackleFormData = {
  category: '',
  maker: '',
  name: '',
  size: '',
  weight: '',
  stockQty: '',
  needRestock: false,
  memo: '',
};

export function TerminalTackleManagementCard({
  terminalTackles,
  onAddTerminalTackle,
  onUpdateTerminalTackle,
  onDeleteTerminalTackle,
  isLoading,
}: TerminalTackleManagementCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<TerminalTackleFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');

  // 動的にカテゴリ一覧を取得（登録済みデータから）
  const uniqueCategories = useMemo(() => {
    const categories = new Map<string, number>();
    terminalTackles.forEach((item) => {
      const count = categories.get(item.category) || 0;
      categories.set(item.category, count + 1);
    });
    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }, [terminalTackles]);

  // カテゴリでフィルタリング
  const filteredItems = useMemo(() => {
    if (!filterCategory) return terminalTackles;
    return terminalTackles.filter((item) => item.category === filterCategory);
  }, [terminalTackles, filterCategory]);

  const handleSubmit = async () => {
    if (!form.category || !form.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateTerminalTackle(editingId, form);
      } else {
        await onAddTerminalTackle(form);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (item: TerminalTackle) => {
    setForm({
      category: item.category,
      maker: item.maker || '',
      name: item.name,
      size: item.size || '',
      weight: item.weight || '',
      stockQty: item.stockQty?.toString() || '',
      needRestock: item.needRestock,
      memo: item.memo || '',
    });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleCopy = (item: TerminalTackle) => {
    setForm({
      category: item.category,
      maker: item.maker || '',
      name: item.name,
      size: item.size || '',
      weight: item.weight || '',
      stockQty: '',
      needRestock: false,
      memo: item.memo || '',
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <span className="font-semibold">小物管理（フック・シンカー等）</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (isFormOpen && !editingId) {
              resetForm();
            } else {
              setEditingId(null);
              setForm(EMPTY_FORM);
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
                      カテゴリ <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例: フック、シンカー、スナップ"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      list="terminal-tackle-categories"
                    />
                    <datalist id="terminal-tackle-categories">
                      {TERMINAL_TACKLE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.label} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      製品名・型番 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例: オフセットフック #2"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      list="terminal-tackle-names"
                    />
                    {form.category === 'sinker' && (
                      <datalist id="terminal-tackle-names">
                        {SINKER_TYPES.map((s) => (
                          <option key={s.value} value={s.label} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">メーカー</label>
                    <Input
                      placeholder="例: がまかつ"
                      value={form.maker}
                      onChange={(e) => setForm({ ...form, maker: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">サイズ</label>
                    <Input
                      placeholder="例: #1, #2, M"
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                    />
                  </div>
                  {(form.category === 'sinker' || form.category === '') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">重さ</label>
                      <Input
                        placeholder="例: 3.5g, 1/4oz"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">所持数</label>
                    <Input
                      type="number"
                      placeholder="例: 10"
                      value={form.stockQty}
                      onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                    <Input
                      placeholder="例: ロックフィッシュ用"
                      value={form.memo}
                      onChange={(e) => setForm({ ...form, memo: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="needRestock"
                      checked={form.needRestock}
                      onChange={(e) => setForm({ ...form, needRestock: e.target.checked })}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <label htmlFor="needRestock" className="text-xs text-gray-700">
                      要補充
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  ※ フック・シンカー・スナップ等の小物をざっくり管理できます
                </p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !form.category || !form.name.trim()}
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

            {/* フィルター */}
            {terminalTackles.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setFilterCategory('')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    filterCategory === ''
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                {uniqueCategories.map(({ category, count }) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFilterCategory(category)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      filterCategory === category
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category} ({count})
                  </button>
                ))}
              </div>
            )}

            {/* 一覧 */}
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {terminalTackles.length === 0
                  ? 'まだ小物が登録されていません'
                  : '該当する小物がありません'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <TerminalTackleItem
                    key={item.id}
                    item={item}
                    onEdit={() => handleEdit(item)}
                    onCopy={() => handleCopy(item)}
                    onDelete={() => onDeleteTerminalTackle(item.id)}
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

// アイテムコンポーネント
function TerminalTackleItem({
  item,
  onEdit,
  onCopy,
  onDelete,
}: {
  item: TerminalTackle;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const categoryLabel =
    TERMINAL_TACKLE_CATEGORIES.find((c) => c.value === item.category)?.label || item.category;

  return (
    <div
      onClick={onEdit}
      className={`bg-white border rounded-lg p-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
        item.needRestock ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">
              {categoryLabel}
            </span>
            {item.needRestock && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                要補充
              </span>
            )}
          </div>
          <div className="font-medium text-gray-900 mt-1">
            {item.maker && <span className="text-gray-500">{item.maker} </span>}
            {item.name}
          </div>
          <div className="text-gray-500 text-xs mt-1 space-x-2">
            {item.size && <span>サイズ: {item.size}</span>}
            {item.weight && <span>重さ: {item.weight}</span>}
            {item.stockQty !== null && <span>所持: {item.stockQty}個</span>}
          </div>
          {item.memo && <p className="text-gray-400 text-xs mt-1">{item.memo}</p>}
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
