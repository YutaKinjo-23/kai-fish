'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { FISH_SPECIES_MASTER } from '@/lib/master/fish-species';
import { RIG_TYPES_MASTER } from '@/lib/master/rig-types';
import type { TackleSet } from '@/types/tackle';

interface TackleSetCardProps {
  tackleSet: TackleSet;
  onEdit: () => void;
  onDelete: () => void;
}

export function TackleSetCard({ tackleSet, onEdit, onDelete }: TackleSetCardProps) {
  // リグ名取得
  const rigNames = tackleSet.rigs
    ? tackleSet.rigs.split(',').map((id) => {
        const rig = RIG_TYPES_MASTER.find((r) => r.id === id);
        return rig?.name || id;
      })
    : [];

  // ターゲット名取得
  const targetNames = tackleSet.targets
    ? tackleSet.targets.split(',').map((id) => {
        const species = FISH_SPECIES_MASTER.find((s) => s.id === id);
        return species?.kana || id;
      })
    : [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{tackleSet.name}</h3>
          {tackleSet.purpose && <p className="text-sm text-gray-500 mt-0.5">{tackleSet.purpose}</p>}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-gray-100 rounded transition-colors"
            title="編集"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* タックル情報 */}
      <div className="space-y-2 text-sm">
        {/* ロッド */}
        {tackleSet.rod && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">ロッド</span>
            <span className="text-gray-900">
              {tackleSet.rod.name}
              {tackleSet.rod.lengthFt && (
                <span className="text-gray-500 ml-1">{tackleSet.rod.lengthFt}</span>
              )}
            </span>
          </div>
        )}

        {/* リール */}
        {tackleSet.reel && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">リール</span>
            <span className="text-gray-900">
              {tackleSet.reel.name}
              {tackleSet.reel.size && (
                <span className="text-gray-500 ml-1">{tackleSet.reel.size}</span>
              )}
            </span>
          </div>
        )}

        {/* メインライン */}
        {tackleSet.mainLine && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">ライン</span>
            <span className="text-gray-900">
              {tackleSet.mainLine.name}
              {tackleSet.mainLine.thickness && (
                <span className="text-gray-500 ml-1">{tackleSet.mainLine.thickness}</span>
              )}
            </span>
          </div>
        )}

        {/* リーダー */}
        {(tackleSet.leaderLb || tackleSet.leaderLength) && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500 w-16 flex-shrink-0">リーダー</span>
            <span className="text-gray-900">
              {[tackleSet.leaderLb, tackleSet.leaderLength].filter(Boolean).join(' / ')}
            </span>
          </div>
        )}
      </div>

      {/* タグ */}
      {(rigNames.length > 0 || targetNames.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {rigNames.map((name, i) => (
              <span
                key={`rig-${i}`}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {name}
              </span>
            ))}
            {targetNames.map((name, i) => (
              <span
                key={`target-${i}`}
                className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
