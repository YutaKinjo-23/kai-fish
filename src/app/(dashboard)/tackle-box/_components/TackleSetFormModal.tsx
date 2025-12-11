'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FISH_SPECIES_MASTER } from '@/lib/master/fish-species';
import { RIG_TYPES_MASTER } from '@/lib/master/rig-types';
import type { TackleSet, TackleSetFormData, Rod, Reel, Line } from '@/types/tackle';

interface TackleSetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TackleSetFormData) => Promise<void>;
  editData?: TackleSet | null;
  rods: Rod[];
  reels: Reel[];
  lines: Line[];
  tackleSets: TackleSet[];
  onNavigateToTab?: (tab: 'rod' | 'reel' | 'line') => void;
}

const EMPTY_FORM: TackleSetFormData = {
  name: '',
  purpose: '',
  rodId: '',
  reelId: '',
  mainLineId: '',
  leaderId: '',
  leaderLb: '',
  leaderLength: '',
  rigs: [],
  targets: [],
};

export function TackleSetFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  rods,
  reels,
  lines,
  tackleSets,
  onNavigateToTab,
}: TackleSetFormModalProps) {
  const [formData, setFormData] = useState<TackleSetFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 本線として登録されているライン
  const mainLines = useMemo(() => {
    return lines.filter((l) => l.lineRole === 'main');
  }, [lines]);

  // リーダーとして登録されているライン
  const leaderLines = useMemo(() => {
    return lines.filter((l) => l.lineRole === 'leader');
  }, [lines]);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        purpose: editData.purpose || '',
        rodId: editData.rodId || '',
        reelId: editData.reelId || '',
        mainLineId: editData.mainLineId || '',
        leaderId: editData.leaderId || '',
        leaderLb: editData.leaderLb || '',
        leaderLength: editData.leaderLength || '',
        rigs: editData.rigs ? editData.rigs.split(',') : [],
        targets: editData.targets ? editData.targets.split(',') : [],
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [editData, isOpen]);

  // リグ用の状態
  const [rigInput, setRigInput] = useState('');
  const [showRigDropdown, setShowRigDropdown] = useState(false);
  const rigInputRef = useRef<HTMLInputElement>(null);
  const rigContainerRef = useRef<HTMLDivElement>(null);

  // 魚種用の状態
  const [fishInput, setFishInput] = useState('');
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const fishInputRef = useRef<HTMLInputElement>(null);
  const fishContainerRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rigContainerRef.current && !rigContainerRef.current.contains(e.target as Node)) {
        setShowRigDropdown(false);
      }
      if (fishContainerRef.current && !fishContainerRef.current.contains(e.target as Node)) {
        setShowFishDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // リグを選択（マスターから）
  const handleSelectRig = (rigName: string) => {
    if (!formData.rigs.includes(rigName)) {
      setFormData((prev) => ({ ...prev, rigs: [...prev.rigs, rigName] }));
    }
    setRigInput('');
    setShowRigDropdown(false);
    rigInputRef.current?.focus();
  };

  // リグを追加（自由入力）
  const handleAddCustomRig = () => {
    const trimmed = rigInput.trim();
    if (trimmed && !formData.rigs.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, rigs: [...prev.rigs, trimmed] }));
    }
    setRigInput('');
    setShowRigDropdown(false);
  };

  // リグを削除
  const handleRemoveRig = (rig: string) => {
    setFormData((prev) => ({ ...prev, rigs: prev.rigs.filter((r) => r !== rig) }));
  };

  // 既存のタックルセットから登録されたカスタムリグを抽出
  const existingCustomRigs = useMemo(() => {
    const masterRigNames = RIG_TYPES_MASTER.map((r) => r.name);
    const allRigs = new Set<string>();
    tackleSets.forEach((set) => {
      if (set.rigs) {
        set.rigs.split(',').forEach((rig) => {
          const trimmed = rig.trim();
          if (trimmed && !masterRigNames.includes(trimmed)) {
            allRigs.add(trimmed);
          }
        });
      }
    });
    return [...allRigs].sort();
  }, [tackleSets]);

  // リグのフィルタリング（マスター + 既存カスタムリグ）
  const filteredRigs = useMemo(() => {
    const masterRigs = RIG_TYPES_MASTER.filter((rig) => {
      if (formData.rigs.includes(rig.name)) return false;
      if (!rigInput) return true;
      return rig.name.includes(rigInput);
    }).map((rig) => ({ type: 'master' as const, name: rig.name }));

    const customRigs = existingCustomRigs
      .filter((rig) => {
        if (formData.rigs.includes(rig)) return false;
        if (!rigInput) return true;
        return rig.includes(rigInput);
      })
      .map((rig) => ({ type: 'custom' as const, name: rig }));

    return [...masterRigs, ...customRigs];
  }, [formData.rigs, rigInput, existingCustomRigs]);

  // 魚種を選択
  const handleSelectFish = (fishId: string) => {
    if (!formData.targets.includes(fishId)) {
      setFormData((prev) => ({ ...prev, targets: [...prev.targets, fishId] }));
    }
    setFishInput('');
    setShowFishDropdown(false);
    fishInputRef.current?.focus();
  };

  // 魚種を削除
  const handleRemoveFish = (fishId: string) => {
    setFormData((prev) => ({ ...prev, targets: prev.targets.filter((t) => t !== fishId) }));
  };

  // 魚種のフィルタリング
  const filteredFish = FISH_SPECIES_MASTER.filter((fish) => {
    if (formData.targets.includes(fish.id)) return false;
    if (!fishInput) return true;
    return fish.kana.includes(fishInput) || (fish.kanji && fish.kanji.includes(fishInput));
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'タックルセットを編集' : '新規タックルセット'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* セット名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            セット名 <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例: ナイトロック西浦セット"
            required
          />
        </div>

        {/* 用途 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用途</label>
          <Input
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="例: 夜のロックフィッシュ用"
          />
        </div>

        {/* ロッド */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ロッド</label>
          {rods.length > 0 ? (
            <Select
              value={formData.rodId}
              onChange={(value) => setFormData({ ...formData, rodId: value })}
              options={rods.map((r) => ({
                value: r.id,
                label: r.maker ? `${r.maker} ${r.name}` : r.name,
              }))}
              placeholder="ロッドを選択"
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">登録されたロッドがありません。</p>
              <p className="text-xs text-gray-500 mb-3">ロッド管理から追加してください。</p>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('rod');
                  }}
                  className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
                >
                  ロッド管理へ →
                </button>
              )}
            </div>
          )}
        </div>

        {/* リール */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">リール</label>
          {reels.length > 0 ? (
            <Select
              value={formData.reelId}
              onChange={(value) => setFormData({ ...formData, reelId: value })}
              options={reels.map((r) => ({
                value: r.id,
                label: r.maker ? `${r.maker} ${r.name}` : r.name,
              }))}
              placeholder="リールを選択"
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">登録されたリールがありません。</p>
              <p className="text-xs text-gray-500 mb-3">リール管理から追加してください。</p>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('reel');
                  }}
                  className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
                >
                  リール管理へ →
                </button>
              )}
            </div>
          )}
        </div>

        {/* メインライン */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メインライン</label>
          {mainLines.length > 0 ? (
            <Select
              value={formData.mainLineId}
              onChange={(value) => setFormData({ ...formData, mainLineId: value })}
              options={mainLines.map((l) => ({
                value: l.id,
                label: `${l.maker ? `${l.maker} ` : ''}${l.name}${l.thickness ? ` ${l.thickness}号` : ''}`,
              }))}
              placeholder="本線を選択"
            />
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">登録された本線がありません。</p>
              <p className="text-xs text-gray-500 mb-3">
                ライン管理で「ライン用途: 本線」として追加してください。
              </p>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('line');
                  }}
                  className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
                >
                  ライン管理へ →
                </button>
              )}
            </div>
          )}
        </div>

        {/* リーダー */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">リーダー</label>
          {leaderLines.length > 0 ? (
            <>
              <Select
                value={formData.leaderId}
                onChange={(value) => setFormData({ ...formData, leaderId: value })}
                options={leaderLines.map((l) => ({
                  value: l.id,
                  label: `${l.maker ? `${l.maker} ` : ''}${l.name}${l.lb ? ` ${l.lb}lb` : ''}`,
                }))}
                placeholder="リーダーを選択"
              />
              {/* リーダー長さ */}
              <div className="mt-2">
                <Input
                  value={formData.leaderLength}
                  onChange={(e) => setFormData({ ...formData, leaderLength: e.target.value })}
                  placeholder="長さ（例: 1ヒロ）"
                />
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">登録されたリーダーがありません。</p>
              <p className="text-xs text-gray-500 mb-3">
                ライン管理で「ライン用途: リーダー」として追加してください。
              </p>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('line');
                  }}
                  className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium"
                >
                  ライン管理へ →
                </button>
              )}
            </div>
          )}
        </div>

        {/* 想定リグ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">想定リグ</label>

          {/* 選択済みリグ */}
          {formData.rigs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.rigs.map((rig) => (
                <span
                  key={rig}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-full text-sm"
                >
                  {rig}
                  <button
                    type="button"
                    onClick={() => handleRemoveRig(rig)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* リグ入力 */}
          <div className="relative" ref={rigContainerRef}>
            <input
              ref={rigInputRef}
              type="text"
              value={rigInput}
              onChange={(e) => setRigInput(e.target.value)}
              onFocus={() => setShowRigDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomRig();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="リグ名を入力または選択"
            />

            {/* ドロップダウン */}
            {showRigDropdown && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {/* 自由入力の候補 */}
                {rigInput.trim() &&
                  !formData.rigs.includes(rigInput.trim()) &&
                  !filteredRigs.some((r) => r.name === rigInput.trim()) && (
                    <li>
                      <button
                        type="button"
                        onClick={handleAddCustomRig}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-brand-primary"
                      >
                        「{rigInput.trim()}」を追加
                      </button>
                    </li>
                  )}
                {filteredRigs.length > 0 ? (
                  filteredRigs.map((rig) => (
                    <li key={rig.name}>
                      <button
                        type="button"
                        onClick={() => handleSelectRig(rig.name)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex justify-between items-center"
                      >
                        <span>{rig.name}</span>
                        {rig.type === 'custom' && (
                          <span className="text-xs text-gray-400">カスタム</span>
                        )}
                      </button>
                    </li>
                  ))
                ) : !rigInput.trim() ? (
                  <li className="px-3 py-2 text-sm text-gray-500">リグ候補がありません</li>
                ) : null}
              </ul>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">既存のリグを選択、または自由に入力できます</p>
        </div>

        {/* ターゲット魚種 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ターゲット魚種</label>

          {/* 選択済み魚種 */}
          {formData.targets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.targets.map((fishId) => {
                const fish = FISH_SPECIES_MASTER.find((f) => f.id === fishId);
                return (
                  <span
                    key={fishId}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-full text-sm"
                    title={fish?.kanji ?? undefined}
                  >
                    {fish?.kana ?? fishId}
                    <button
                      type="button"
                      onClick={() => handleRemoveFish(fishId)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* 魚種入力 */}
          <div className="relative" ref={fishContainerRef}>
            <input
              ref={fishInputRef}
              type="text"
              value={fishInput}
              onChange={(e) => setFishInput(e.target.value)}
              onFocus={() => setShowFishDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="魚種名を入力して絞り込み"
            />

            {/* ドロップダウン */}
            {showFishDropdown && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredFish.length > 0 ? (
                  filteredFish.map((fish) => (
                    <li key={fish.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectFish(fish.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex justify-between items-center"
                      >
                        <span>{fish.kana}</span>
                        {fish.kanji && <span className="text-gray-400 text-xs">{fish.kanji}</span>}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-gray-500">該当する魚種がありません</li>
                )}
              </ul>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">入力で絞り込み、候補から選択できます</p>
        </div>

        {/* ボタン */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editData ? (
              '更新'
            ) : (
              '作成'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
