'use client';

import { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { FISH_SPECIES_MASTER } from '@/lib/master/fish-species';
import type {
  FishingLogFilter,
  FishingLogSort,
  FishingLogSortKey,
  SortOrder,
} from '@/types/fishing-log';

interface FishingLogFiltersProps {
  filter: FishingLogFilter;
  sort: FishingLogSort;
  onFilterChange: (filter: FishingLogFilter) => void;
  onSortChange: (sort: FishingLogSort) => void;
  userAreas?: string[];
  userSpots?: string[];
}

export function FishingLogFilters({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  userAreas = [],
  userSpots = [],
}: FishingLogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilter =
    filter.dateFrom || filter.dateTo || filter.area || filter.spot || filter.mainTarget;

  const clearFilters = () => {
    onFilterChange({});
  };

  // エリアオプションを構築（よく行くエリアから選択）
  const areaOptions = useMemo(() => {
    return userAreas.map((area) => ({
      value: area,
      label: area,
    }));
  }, [userAreas]);

  const targetOptions = FISH_SPECIES_MASTER.map((f) => ({ value: f.id, label: f.kana }));

  const spotOptions = useMemo(() => {
    return userSpots.map((spot) => ({
      value: spot,
      label: spot,
    }));
  }, [userSpots]);

  const sortOptions: { value: string; label: string }[] = [
    { value: 'date-desc', label: '日付（新しい順）' },
    { value: 'date-asc', label: '日付（古い順）' },
    { value: 'totalCatch-desc', label: '釣果多い順' },
    { value: 'totalCatch-asc', label: '釣果少ない順' },
    { value: 'maxSize-desc', label: 'サイズ大きい順' },
    { value: 'maxSize-asc', label: 'サイズ小さい順' },
  ];

  const currentSortValue = `${sort.key}-${sort.order}`;

  const handleSortChange = (value: string) => {
    const [key, order] = value.split('-') as [FishingLogSortKey, SortOrder];
    onSortChange({ key, order });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasActiveFilter
                ? 'bg-brand-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            フィルタ
            {hasActiveFilter && <span className="bg-white/20 px-1.5 rounded text-xs">ON</span>}
          </button>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              クリア
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">並び替え:</span>
          <Select
            value={currentSortValue}
            onChange={handleSortChange}
            options={sortOptions}
            className="w-44"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">開始日</label>
            <Input
              type="date"
              value={filter.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">終了日</label>
            <Input
              type="date"
              value={filter.dateTo || ''}
              onChange={(e) => onFilterChange({ ...filter, dateTo: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">エリア</label>
            <Select
              value={filter.area || ''}
              onChange={(value) => onFilterChange({ ...filter, area: value || undefined })}
              options={areaOptions}
              placeholder="すべて"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">スポット</label>
            <Select
              value={filter.spot || ''}
              onChange={(value) => onFilterChange({ ...filter, spot: value || undefined })}
              options={spotOptions}
              placeholder="すべて"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ターゲット魚種</label>
            <Select
              value={filter.mainTarget || ''}
              onChange={(value) => onFilterChange({ ...filter, mainTarget: value || undefined })}
              options={targetOptions}
              placeholder="すべて"
            />
          </div>
        </div>
      )}
    </div>
  );
}
