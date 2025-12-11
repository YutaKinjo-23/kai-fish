'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Clock,
  MapPin,
  Target,
  Fish,
  Flag,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { FISH_SPECIES_MASTER } from '@/lib/master/fish-species';
import type {
  FishingLogFormData,
  FishingEvent,
  FishingEventType,
  FishingEventStart,
  FishingEventSpot,
  FishingEventSetup,
  FishingEventCatch,
  FishingEventEnd,
} from '@/types/fishing-log';

// 現在時刻をHH:mm形式で取得（15分単位で切り上げ）
const getCurrentTime = (): string => {
  const now = new Date();
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  const hours = minutes === 60 ? now.getHours() + 1 : now.getHours();
  const adjustedMinutes = minutes === 60 ? 0 : minutes;
  return `${String(hours % 24).padStart(2, '0')}:${String(adjustedMinutes).padStart(2, '0')}`;
};

// 時刻を加算するヘルパー
const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

// 現在時刻から指定分を加算（15分単位で切り上げ）
// 日付をまたいだ場合は翌日フラグも返す
const addMinutesFromNow = (minutes: number): { time: string; isNextDay: boolean } => {
  const now = new Date();
  const currentMinutes = Math.ceil(now.getMinutes() / 15) * 15;
  const adjustedNow = new Date(now);
  if (currentMinutes === 60) {
    adjustedNow.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    adjustedNow.setMinutes(currentMinutes, 0, 0);
  }

  const originalDate = adjustedNow.getDate();
  adjustedNow.setMinutes(adjustedNow.getMinutes() + minutes);
  const isNextDay = adjustedNow.getDate() !== originalDate;

  return {
    time: `${String(adjustedNow.getHours()).padStart(2, '0')}:${String(adjustedNow.getMinutes()).padStart(2, '0')}`,
    isNextDay,
  };
};

// 15分単位の時刻オプションを生成
const generateTimeOptions = (): { value: string; label: string }[] => {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push({ value, label: value });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// 時刻選択コンポーネント（現在時刻に近いオプションにスクロール）
interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

function TimeSelect({ value, onChange }: TimeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 現在時刻に最も近いオプションのインデックスを取得
  const getNearestTimeIndex = useCallback(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let nearestIndex = 0;
    let minDiff = Infinity;

    TIME_OPTIONS.forEach((option, idx) => {
      const [h, m] = option.value.split(':').map(Number);
      const optionMinutes = h * 60 + m;
      const diff = Math.abs(optionMinutes - currentMinutes);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = idx;
      }
    });

    return nearestIndex;
  }, []);

  // ドロップダウンを開いた時に現在時刻に近い位置にスクロール
  useEffect(() => {
    if (isOpen && listRef.current) {
      const nearestIndex = getNearestTimeIndex();
      const itemHeight = 36; // 各オプションの高さ
      const scrollTop = Math.max(0, nearestIndex * itemHeight - 3 * itemHeight);
      listRef.current.scrollTop = scrollTop;
    }
  }, [isOpen, getNearestTimeIndex]);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const currentTime = getCurrentTime();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-24 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value || '時刻'}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-30 w-24 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {TIME_OPTIONS.map((option) => {
            const isNearCurrent = option.value === currentTime;
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-brand-primary text-white'
                    : isNearCurrent
                      ? 'bg-brand-primary/10 text-brand-primary font-medium'
                      : 'hover:bg-gray-100'
                }`}
              >
                {option.label}
                {isNearCurrent && !isSelected && <span className="ml-1 text-xs">(今)</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 魚種オートコンプリートコンポーネント
interface FishSpeciesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function FishSpeciesAutocomplete({
  value,
  onChange,
  placeholder = '例: シーバス',
}: FishSpeciesAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // valueが外部から変更された場合に同期
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 入力値でフィルタリング
  const filteredSpecies = FISH_SPECIES_MASTER.filter((species) => {
    if (!inputValue) return true;
    const search = inputValue.toLowerCase();
    return (
      species.kana.toLowerCase().includes(search) ||
      (species.kanji && species.kanji.includes(search))
    );
  }).slice(0, 10);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (species: { id: string; kana: string }) => {
    setInputValue(species.kana);
    onChange(species.kana);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
      />
      {isOpen && filteredSpecies.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSpecies.map((species) => (
            <button
              key={species.id}
              type="button"
              onClick={() => handleSelect(species)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/10 flex items-center justify-between"
            >
              <span>{species.kana}</span>
              {species.kanji && <span className="text-xs text-gray-400">{species.kanji}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FishingLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FishingLogFormData) => Promise<void>;
  onDelete?: () => void;
  initialData?: FishingLogFormData;
  mode: 'create' | 'edit';
  userAreas?: string[];
}

// デフォルトのイベント生成
const createDefaultEvent = (type: FishingEventType, order: number, time = ''): FishingEvent => {
  const base = { time, order };
  switch (type) {
    case 'start':
      return { ...base, type: 'start' } as FishingEventStart;
    case 'spot':
      return { ...base, type: 'spot', area: '', spotName: '' } as FishingEventSpot;
    case 'setup':
      return { ...base, type: 'setup', target: '', tackle: '', rig: '' } as FishingEventSetup;
    case 'catch':
      return {
        ...base,
        type: 'catch',
        speciesId: '',
        sizeCm: null,
        photoUrl: null,
      } as FishingEventCatch;
    case 'end':
      return { ...base, type: 'end' } as FishingEventEnd;
  }
};

// 初期フォームデータ
const createEmptyFormData = (): FishingLogFormData => {
  const now = getCurrentTime();
  const endTime = addMinutesToTime(now, 6 * 60); // 6時間後
  return {
    date: new Date().toISOString().split('T')[0],
    memo: '',
    events: [
      createDefaultEvent('start', 0, now),
      createDefaultEvent('spot', 1),
      createDefaultEvent('end', 2, endTime),
    ],
  };
};

// イベントタイプの表示情報
const EVENT_TYPE_INFO: Record<
  FishingEventType,
  { label: string; icon: React.ReactNode; colorClass: string }
> = {
  start: { label: '開始', icon: <Clock className="w-4 h-4" />, colorClass: 'text-brand-primary' },
  spot: {
    label: 'スポット',
    icon: <MapPin className="w-4 h-4" />,
    colorClass: 'text-brand-primary',
  },
  setup: {
    label: 'セットアップ',
    icon: <Target className="w-4 h-4" />,
    colorClass: 'text-brand-primary',
  },
  catch: { label: '釣果', icon: <Fish className="w-4 h-4" />, colorClass: 'text-brand-primary' },
  end: { label: '終了', icon: <Flag className="w-4 h-4" />, colorClass: 'text-brand-primary' },
};

export function FishingLogFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  mode,
  userAreas = [],
}: FishingLogFormModalProps) {
  const [formData, setFormData] = useState<FishingLogFormData>(createEmptyFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.events && initialData.events.length > 0) {
        setFormData(initialData);
      } else {
        setFormData(createEmptyFormData());
      }
      setError(null);
      setShowAddMenu(null);
    }
  }, [isOpen, initialData]);

  // エリア検索用state
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [activeAreaIndex, setActiveAreaIndex] = useState<number | null>(null);
  const areaSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // スポット検索用state
  const [spotSuggestions, setSpotSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(false);
  const [activeSpotIndex, setActiveSpotIndex] = useState<number | null>(null);

  // エリア検索API
  const searchAreas = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setAreaSuggestions([]);
      return;
    }

    setIsSearchingArea(true);
    try {
      const url = `https://geoapi.heartrails.com/api/json?method=suggest&matching=like&keyword=${encodeURIComponent(keyword)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const locations = data.response?.location ?? [];
        const citySet = new Set<string>();
        locations.forEach((loc: { prefecture: string; city: string }) => {
          const cityWithWardMatch = loc.city.match(/^(.+?市.+?区)/);
          if (cityWithWardMatch) {
            citySet.add(`${loc.prefecture} ${cityWithWardMatch[1]}`);
          } else {
            const cityMatch = loc.city.match(/^(.+?[市区郡])/);
            const cityName = cityMatch ? cityMatch[1] : loc.city;
            citySet.add(`${loc.prefecture} ${cityName}`);
          }
        });
        setAreaSuggestions([...citySet].slice(0, 10));
      }
    } catch {
      console.error('エリア検索に失敗しました');
    } finally {
      setIsSearchingArea(false);
    }
  }, []);

  // スポット取得
  const fetchSpots = useCallback(async (area: string) => {
    if (!area || area.length < 2) {
      setSpotSuggestions([]);
      return;
    }

    setIsLoadingSpots(true);
    try {
      const res = await fetch(`/api/spots?area=${encodeURIComponent(area)}`);
      if (res.ok) {
        const data = await res.json();
        setSpotSuggestions(data.spots || []);
      }
    } catch {
      console.error('スポット取得に失敗しました');
    } finally {
      setIsLoadingSpots(false);
    }
  }, []);

  // イベント更新
  const updateEvent = <T extends FishingEvent>(index: number, updates: Partial<T>) => {
    const newEvents = [...formData.events];
    newEvents[index] = { ...newEvents[index], ...updates } as FishingEvent;
    setFormData({ ...formData, events: newEvents });
  };

  // イベント追加
  const addEventAt = (afterIndex: number, type: FishingEventType) => {
    const newEvents = [...formData.events];
    const newOrder = afterIndex + 1;
    const newEvent = createDefaultEvent(type, newOrder, formData.events[afterIndex]?.time || '');

    // 挿入
    newEvents.splice(newOrder, 0, newEvent);

    // orderを再計算
    newEvents.forEach((e, i) => {
      e.order = i;
    });

    setFormData({ ...formData, events: newEvents });
    setShowAddMenu(null);
  };

  // イベント削除
  const removeEvent = (index: number) => {
    const event = formData.events[index];
    // start/endは削除不可
    if (event.type === 'start' || event.type === 'end') return;

    const newEvents = formData.events.filter((_, i) => i !== index);
    newEvents.forEach((e, i) => {
      e.order = i;
    });
    setFormData({ ...formData, events: newEvents });
  };

  // イベント移動（上下入れ替え）
  const moveEvent = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    // start/endは移動不可、範囲外も不可
    if (toIndex < 1 || toIndex >= formData.events.length - 1) return;
    const fromEvent = formData.events[fromIndex];
    if (fromEvent.type === 'start' || fromEvent.type === 'end') return;
    const toEvent = formData.events[toIndex];
    if (toEvent.type === 'start' || toEvent.type === 'end') return;

    const newEvents = [...formData.events];
    [newEvents[fromIndex], newEvents[toIndex]] = [newEvents[toIndex], newEvents[fromIndex]];
    newEvents.forEach((e, i) => {
      e.order = i;
    });
    setFormData({ ...formData, events: newEvents });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!formData.date) {
      setError('日付は必須です。');
      return;
    }

    // 少なくとも1つのスポットイベントが必要
    const hasSpot = formData.events.some((e) => e.type === 'spot' && e.spotName);
    if (!hasSpot) {
      setError('少なくとも1つのスポットを入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      // 新しいスポットを自動登録
      const spotEvents = formData.events.filter(
        (e): e is FishingEventSpot => e.type === 'spot' && !!e.spotName && !!e.area
      );
      for (const spotEvent of spotEvents) {
        await fetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: spotEvent.spotName, area: spotEvent.area }),
        });
      }

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // イベントカードのレンダリング
  const renderEventCard = (event: FishingEvent, index: number) => {
    const info = EVENT_TYPE_INFO[event.type];
    const isFirst = index === 0;
    const isLast = index === formData.events.length - 1;
    // 最初のスポットかどうか（削除不可）
    const isFirstSpot =
      event.type === 'spot' && formData.events.findIndex((e) => e.type === 'spot') === index;
    // 削除可能かどうか
    const canDelete = event.type !== 'start' && event.type !== 'end' && !isFirstSpot;

    return (
      <div key={index} className="relative">
        {/* タイムラインコネクタ（上） */}
        {!isFirst && <div className="absolute left-[15px] -top-4 w-[2px] h-4 bg-[#D0D5DD]" />}

        {/* イベントカード */}
        <div className="flex items-start gap-2">
          {/* 並び替えハンドル */}
          {event.type !== 'start' && event.type !== 'end' && (
            <div className="flex flex-col gap-0.5 pt-1">
              <button
                type="button"
                onClick={() => moveEvent(index, 'up')}
                disabled={index <= 1}
                className="p-0.5 text-gray-400 hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="上に移動"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveEvent(index, 'down')}
                disabled={index >= formData.events.length - 2}
                className="p-0.5 text-gray-400 hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="下に移動"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* アイコン - 白背景＋ブランドカラーアイコン */}
          <div
            className={`flex-shrink-0 w-8 h-8 bg-white border-2 border-brand-primary rounded-full flex items-center justify-center ${info.colorClass}`}
          >
            {info.icon}
          </div>

          {/* コンテンツ - カードスタイル */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-brand-primary">{info.label}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <TimeSelect
                    value={event.time}
                    onChange={(value) => updateEvent(index, { time: value })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const result = addMinutesFromNow(15);
                      updateEvent(index, { time: result.time });
                      if (result.isNextDay) {
                        // 日付を翌日に更新
                        const currentDate = new Date(formData.date);
                        currentDate.setDate(currentDate.getDate() + 1);
                        setFormData((prev) => ({
                          ...prev,
                          date: currentDate.toISOString().split('T')[0],
                        }));
                      }
                    }}
                    className="px-1.5 py-1 text-xs text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded transition-colors"
                    title="現在時刻+15分"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const result = addMinutesFromNow(60);
                      updateEvent(index, { time: result.time });
                      if (result.isNextDay) {
                        // 日付を翌日に更新
                        const currentDate = new Date(formData.date);
                        currentDate.setDate(currentDate.getDate() + 1);
                        setFormData((prev) => ({
                          ...prev,
                          date: currentDate.toISOString().split('T')[0],
                        }));
                      }
                    }}
                    className="px-1.5 py-1 text-xs text-gray-500 hover:text-brand-primary hover:bg-brand-primary/5 rounded transition-colors"
                    title="現在時刻+1時間"
                  >
                    +1h
                  </button>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => removeEvent(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* タイプ別のフィールド - 縦積みレイアウト */}
            {event.type === 'spot' && (
              <SpotEventFields
                event={event}
                index={index}
                updateEvent={updateEvent}
                userAreas={userAreas}
                areaSuggestions={areaSuggestions}
                isSearchingArea={isSearchingArea}
                activeAreaIndex={activeAreaIndex}
                setActiveAreaIndex={setActiveAreaIndex}
                searchAreas={searchAreas}
                areaSearchTimeoutRef={areaSearchTimeoutRef}
                spotSuggestions={spotSuggestions}
                isLoadingSpots={isLoadingSpots}
                activeSpotIndex={activeSpotIndex}
                setActiveSpotIndex={setActiveSpotIndex}
                fetchSpots={fetchSpots}
              />
            )}

            {event.type === 'setup' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ターゲット</label>
                  <FishSpeciesAutocomplete
                    value={(event as FishingEventSetup).target || ''}
                    onChange={(value) => updateEvent<FishingEventSetup>(index, { target: value })}
                    placeholder="例: シーバス、バス"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">タックル</label>
                  <Input
                    type="text"
                    value={(event as FishingEventSetup).tackle || ''}
                    onChange={(e) =>
                      updateEvent<FishingEventSetup>(index, { tackle: e.target.value })
                    }
                    placeholder="使用タックルを入力"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">リグ</label>
                  <Input
                    type="text"
                    value={(event as FishingEventSetup).rig || ''}
                    onChange={(e) => updateEvent<FishingEventSetup>(index, { rig: e.target.value })}
                    placeholder="例: ダウンショット、ネコリグ"
                  />
                </div>
              </div>
            )}

            {event.type === 'catch' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">魚種 *</label>
                  <FishSpeciesAutocomplete
                    value={(event as FishingEventCatch).speciesId}
                    onChange={(value) =>
                      updateEvent<FishingEventCatch>(index, { speciesId: value })
                    }
                    placeholder="例: カサゴ、メバル"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    サイズ (cm)
                  </label>
                  <Input
                    type="number"
                    value={(event as FishingEventCatch).sizeCm ?? ''}
                    onChange={(e) =>
                      updateEvent<FishingEventCatch>(index, {
                        sizeCm: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="例: 35.5"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* start直後のスペーサー */}
        {event.type === 'start' && !isLast && (
          <div className="relative ml-[15px] py-3">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#D0D5DD]" />
          </div>
        )}

        {/* イベント追加ボタン（最後以外、かつstart直後は非表示） */}
        {!isLast && event.type !== 'start' && (
          <div className="relative ml-[15px] py-3">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#D0D5DD]" />
            <div className="relative flex items-center">
              <div className="w-2 h-2 bg-brand-primary rounded-full -ml-[3px]" />
              <button
                type="button"
                onClick={() => setShowAddMenu(showAddMenu === index ? null : index)}
                className="ml-3 flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-brand-primary border border-dashed border-gray-300 hover:border-brand-primary rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>イベントを追加</span>
              </button>
              {showAddMenu === index && (
                <div className="absolute left-8 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-40">
                  {(['spot', 'setup', 'catch'] as FishingEventType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addEventAt(index, type)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/5 flex items-center gap-2"
                    >
                      <span
                        className={`w-6 h-6 bg-white border border-brand-primary rounded-full flex items-center justify-center ${EVENT_TYPE_INFO[type].colorClass}`}
                      >
                        {EVENT_TYPE_INFO[type].icon}
                      </span>
                      <span className="text-gray-700">{EVENT_TYPE_INFO[type].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 最後のコネクタ */}
        {!isLast && showAddMenu !== index && (
          <div className="absolute left-[15px] -bottom-4 w-[2px] h-4 bg-[#D0D5DD]" />
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? '新規釣行記録' : '釣行記録の編集'}
      size="form"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 日付 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">日付 *</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            className="!w-full"
          />
        </div>

        {/* タイムライン */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-brand-primary">タイムライン</legend>
          <div className="space-y-0 pl-1">
            {formData.events.map((event, index) => renderEventCard(event, index))}
          </div>
        </fieldset>

        {/* メモ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">メモ</label>
          <textarea
            value={formData.memo || ''}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            rows={3}
            className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            placeholder="天候、潮、パターンなど自由にメモ"
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <div>
            {mode === 'edit' && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="!text-red-600 !border-red-300 hover:!bg-red-50"
              >
                削除
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? '保存中...' : mode === 'create' ? '登録' : '更新'}
            </Button>
          </div>
        </div>
      </form>

      {/* 削除確認モーダル */}
      {onDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await onDelete();
              setShowDeleteConfirm(false);
            } finally {
              setIsDeleting(false);
            }
          }}
          isDeleting={isDeleting}
        />
      )}
    </Modal>
  );
}

// スポットイベントフィールド（サブコンポーネント）
interface SpotEventFieldsProps {
  event: FishingEventSpot;
  index: number;
  updateEvent: <T extends FishingEvent>(index: number, updates: Partial<T>) => void;
  userAreas: string[];
  areaSuggestions: string[];
  isSearchingArea: boolean;
  activeAreaIndex: number | null;
  setActiveAreaIndex: (index: number | null) => void;
  searchAreas: (keyword: string) => Promise<void>;
  areaSearchTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  spotSuggestions: { id: string; name: string }[];
  isLoadingSpots: boolean;
  activeSpotIndex: number | null;
  setActiveSpotIndex: (index: number | null) => void;
  fetchSpots: (area: string) => Promise<void>;
}

function SpotEventFields({
  event,
  index,
  updateEvent,
  userAreas,
  areaSuggestions,
  isSearchingArea,
  activeAreaIndex,
  setActiveAreaIndex,
  searchAreas,
  areaSearchTimeoutRef,
  spotSuggestions,
  isLoadingSpots,
  activeSpotIndex,
  setActiveSpotIndex,
  fetchSpots,
}: SpotEventFieldsProps) {
  const areaContainerRef = useRef<HTMLDivElement>(null);
  const spotContainerRef = useRef<HTMLDivElement>(null);

  // エリア変更時にスポット候補を取得
  useEffect(() => {
    if (activeAreaIndex === index && event.area) {
      fetchSpots(event.area);
    }
  }, [event.area, activeAreaIndex, index, fetchSpots]);

  // クリック外で閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (areaContainerRef.current && !areaContainerRef.current.contains(e.target as Node)) {
        if (activeAreaIndex === index) setActiveAreaIndex(null);
      }
      if (spotContainerRef.current && !spotContainerRef.current.contains(e.target as Node)) {
        if (activeSpotIndex === index) setActiveSpotIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeAreaIndex, activeSpotIndex, index, setActiveAreaIndex, setActiveSpotIndex]);

  const handleAreaChange = (value: string) => {
    updateEvent<FishingEventSpot>(index, { area: value });
    if (areaSearchTimeoutRef.current) {
      clearTimeout(areaSearchTimeoutRef.current);
    }
    areaSearchTimeoutRef.current = setTimeout(() => {
      searchAreas(value);
    }, 300);
  };

  const filteredUserAreas = userAreas.filter(
    (area) => !event.area || area.toLowerCase().includes(event.area.toLowerCase())
  );

  const filteredSpots = spotSuggestions.filter(
    (spot) => !event.spotName || spot.name.toLowerCase().includes(event.spotName.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* エリア */}
      <div ref={areaContainerRef} className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">エリア（市区郡）</label>
        <div className="relative">
          <input
            type="text"
            value={event.area}
            onChange={(e) => handleAreaChange(e.target.value)}
            onFocus={() => setActiveAreaIndex(index)}
            placeholder="例: 神奈川県 川崎市多摩区"
            className="block w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
          {isSearchingArea && activeAreaIndex === index && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
        {activeAreaIndex === index &&
          (filteredUserAreas.length > 0 || areaSuggestions.length > 0) && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredUserAreas.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                    よく行くエリア
                  </div>
                  {filteredUserAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        updateEvent<FishingEventSpot>(index, { area });
                        setActiveAreaIndex(null);
                        fetchSpots(area);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/10"
                    >
                      {area}
                    </button>
                  ))}
                </>
              )}
              {areaSuggestions.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                    候補
                  </div>
                  {areaSuggestions.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        updateEvent<FishingEventSpot>(index, { area });
                        setActiveAreaIndex(null);
                        fetchSpots(area);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/10"
                    >
                      {area}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
      </div>

      {/* スポット */}
      <div ref={spotContainerRef} className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">スポット名</label>
        <div className="relative">
          <input
            type="text"
            value={event.spotName}
            onChange={(e) => updateEvent<FishingEventSpot>(index, { spotName: e.target.value })}
            onFocus={() => {
              setActiveSpotIndex(index);
              if (event.area) fetchSpots(event.area);
            }}
            placeholder={event.area ? '例: 松島突堤' : 'エリアを先に入力'}
            disabled={!event.area}
            className="block w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {isLoadingSpots && activeSpotIndex === index && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>
        {activeSpotIndex === index && event.area && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSpots.length > 0 ? (
              <>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                  登録済みスポット
                </div>
                {filteredSpots.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => {
                      updateEvent<FishingEventSpot>(index, { spotName: spot.name });
                      setActiveSpotIndex(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/10"
                  >
                    {spot.name}
                  </button>
                ))}
              </>
            ) : event.spotName ? (
              <div className="px-3 py-2 text-sm text-gray-500">「{event.spotName}」を新規登録</div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">スポット名を入力</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
