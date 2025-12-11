'use client';

import { useState } from 'react';
import { Plus, Loader2, Trash2, Copy } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Line, Reel, LineFormData } from '@/types/tackle';
import { LINE_TYPES, LINE_ROLES, LINE_USAGE_TAGS } from '@/types/tackle';

interface LineManagementCardProps {
  lines: Line[];
  reels: Reel[];
  onAddLine: (data: LineFormData) => Promise<void>;
  onUpdateLine: (id: string, data: LineFormData) => Promise<void>;
  onDeleteLine: (id: string) => Promise<void>;
  isLoading: boolean;
}

const EMPTY_LINE_FORM: LineFormData = {
  name: '',
  lineType: '',
  lineRole: '',
  maker: '',
  thickness: '',
  lb: '',
  reelId: '',
  usageTags: [],
};

export function LineManagementCard({
  lines,
  reels,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
  isLoading,
}: LineManagementCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [lineForm, setLineForm] = useState<LineFormData>(EMPTY_LINE_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!lineForm.name.trim() || !lineForm.lineType || !lineForm.lineRole) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateLine(editingId, lineForm);
      } else {
        await onAddLine(lineForm);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLineForm(EMPTY_LINE_FORM);
    setEditingId(null);
    setCustomTags([]);
    setCustomTagInput('');
    setIsFormOpen(false);
  };

  const handleEdit = (line: Line) => {
    const tags = line.usageTags ? line.usageTags.split(',') : [];
    const defaultTagValues = LINE_USAGE_TAGS.map((t) => t.value);
    const customTagsFromLine = tags
      .filter((t) => t.startsWith('custom:'))
      .map((t) => t.replace('custom:', ''));

    setLineForm({
      name: line.name,
      lineType: line.lineType,
      lineRole: line.lineRole || '',
      maker: line.maker || '',
      thickness: line.thickness || '',
      lb: line.lb || '',
      reelId: line.reelId || '',
      usageTags: tags,
    });
    setCustomTags(customTagsFromLine);
    setEditingId(line.id);
    setIsFormOpen(true);
  };

  const handleCopy = (line: Line) => {
    const tags = line.usageTags ? line.usageTags.split(',') : [];
    const customTagsFromLine = tags
      .filter((t) => t.startsWith('custom:'))
      .map((t) => t.replace('custom:', ''));

    setLineForm({
      name: line.name,
      lineType: line.lineType,
      lineRole: line.lineRole || '',
      maker: line.maker || '',
      thickness: line.thickness || '',
      lb: line.lb || '',
      reelId: '', // リールは空にする
      usageTags: tags,
    });
    setCustomTags(customTagsFromLine);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const toggleUsageTag = (tagValue: string) => {
    setLineForm((prev) => ({
      ...prev,
      usageTags: prev.usageTags.includes(tagValue)
        ? prev.usageTags.filter((t) => t !== tagValue)
        : [...prev.usageTags, tagValue],
    }));
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    const existsInDefault = LINE_USAGE_TAGS.some((t) => t.label === trimmed);
    const existsInCustom = customTags.includes(trimmed);
    if (!existsInDefault && !existsInCustom) {
      setCustomTags((prev) => [...prev, trimmed]);
      setLineForm((prev) => ({
        ...prev,
        usageTags: [...prev.usageTags, `custom:${trimmed}`],
      }));
    }
    setCustomTagInput('');
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
    setLineForm((prev) => ({
      ...prev,
      usageTags: prev.usageTags.filter((t) => t !== `custom:${tag}`),
    }));
  };

  // リールのセレクトオプションを生成
  const reelOptions = reels.map((reel) => ({
    value: reel.id,
    label: reel.maker ? `${reel.maker} ${reel.name}` : reel.name,
  }));

  return (
    <Card>
      <CardHeader>
        <h2>ライン管理</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (isFormOpen && !editingId) {
              resetForm();
            } else {
              setEditingId(null);
              setLineForm(EMPTY_LINE_FORM);
              setCustomTags([]);
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
                      製品名 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="例: G-Soul X8 Upgrade"
                      value={lineForm.name}
                      onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ライン種別 <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={lineForm.lineType}
                      onChange={(value) => setLineForm({ ...lineForm, lineType: value })}
                      options={LINE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                      placeholder="選択"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ライン用途 <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={lineForm.lineRole}
                      onChange={(value) => setLineForm({ ...lineForm, lineRole: value })}
                      options={LINE_ROLES.map((r) => ({ value: r.value, label: r.label }))}
                      placeholder="選択"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">メーカー</label>
                    <Input
                      placeholder="例: よつあみ"
                      value={lineForm.maker}
                      onChange={(e) => setLineForm({ ...lineForm, maker: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">号数</label>
                    <Input
                      placeholder="例: 0.6"
                      value={lineForm.thickness}
                      onChange={(e) => setLineForm({ ...lineForm, thickness: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">lb</label>
                    <Input
                      placeholder="例: 14"
                      value={lineForm.lb}
                      onChange={(e) => setLineForm({ ...lineForm, lb: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      巻いているリール
                    </label>
                    <Select
                      value={lineForm.reelId}
                      onChange={(value) => setLineForm({ ...lineForm, reelId: value })}
                      options={reelOptions}
                      placeholder="未設定"
                    />
                  </div>
                </div>

                {/* 使用用途タグ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    使用用途タグ
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {/* デフォルトタグ（その他以外） */}
                    {LINE_USAGE_TAGS.filter((t) => t.value !== 'other').map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => toggleUsageTag(tag.value)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          lineForm.usageTags.includes(tag.value)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                    {/* カスタムタグ */}
                    {customTags.map((tag) => (
                      <button
                        key={`custom:${tag}`}
                        type="button"
                        onClick={() => toggleUsageTag(`custom:${tag}`)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                          lineForm.usageTags.includes(`custom:${tag}`)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                        }`}
                      >
                        {tag}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomTag(tag);
                          }}
                          className="hover:text-red-300 ml-0.5"
                        >
                          ×
                        </span>
                      </button>
                    ))}
                    {/* その他タグ */}
                    <button
                      type="button"
                      onClick={() => toggleUsageTag('other')}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        lineForm.usageTags.includes('other')
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-brand-primary'
                      }`}
                    >
                      その他
                    </button>
                  </div>
                  {/* カスタムタグ追加 */}
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="タグを追加..."
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                      className="flex-1 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addCustomTag}
                      disabled={!customTagInput.trim()}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  ※ 製品名が不明な場合は「PE 0.6号」「アジング用フロロ」などでもOK
                </p>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      !lineForm.name.trim() ||
                      !lineForm.lineType ||
                      !lineForm.lineRole
                    }
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

            {/* ライン一覧 */}
            {lines.length === 0 ? (
              <p className="text-center text-gray-500 py-4">まだラインが登録されていません</p>
            ) : (
              <div className="space-y-2">
                {lines.map((line) => (
                  <LineItem
                    key={line.id}
                    line={line}
                    reels={reels}
                    onEdit={() => handleEdit(line)}
                    onCopy={() => handleCopy(line)}
                    onDelete={() => onDeleteLine(line.id)}
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

// ラインアイテムコンポーネント
function LineItem({
  line,
  reels,
  onEdit,
  onCopy,
  onDelete,
}: {
  line: Line;
  reels: Reel[];
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  // ライン種別のラベルを取得
  const lineTypeLabel = LINE_TYPES.find((t) => t.value === line.lineType)?.label || line.lineType;

  // ライン用途のラベルを取得
  const lineRoleLabel = line.lineRole
    ? LINE_ROLES.find((r) => r.value === line.lineRole)?.label || line.lineRole
    : null;

  // 巻いているリールを取得
  const mountedReel = line.reelId ? reels.find((r) => r.id === line.reelId) : null;

  // 使用用途タグを取得
  const usageTags = line.usageTags
    ? line.usageTags.split(',').map((tagValue) => {
        const tag = LINE_USAGE_TAGS.find((t) => t.value === tagValue);
        return tag?.label || tagValue;
      })
    : [];

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {line.maker && <span className="text-gray-500">{line.maker} </span>}
            {line.name}
          </div>
          <div className="text-gray-500 text-xs mt-1 space-x-2">
            <span className="inline-block bg-gray-100 px-1.5 py-0.5 rounded">{lineTypeLabel}</span>
            {lineRoleLabel && (
              <span className="inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                {lineRoleLabel}
              </span>
            )}
            {line.thickness && <span>{line.thickness}号</span>}
            {line.lb && <span>{line.lb}lb</span>}
          </div>
          {mountedReel && (
            <p className="text-gray-400 text-xs mt-1">
              🎣 {mountedReel.maker ? `${mountedReel.maker} ` : ''}
              {mountedReel.name}
            </p>
          )}
          {usageTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {usageTags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
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
