'use client';

import { FileText } from 'lucide-react';
import { getAreaName } from '@/lib/master/areas';
import type { FishingLogSummary } from '@/types/fishing-log';

interface FishingLogTableProps {
  logs: FishingLogSummary[];
  onRowClick: (id: string) => void;
}

export function FishingLogTable({ logs, onRowClick }: FishingLogTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (start: string | null, end: string | null) => {
    if (!start && !end) return '-';
    if (start && end) return `${start}〜${end}`;
    if (start) return `${start}〜`;
    return `〜${end}`;
  };

  const formatCatchSummary = (total: number, maxSize: number | null) => {
    if (total === 0) return 'ボウズ';
    const parts = [`${total}匹`];
    if (maxSize !== null) {
      parts.push(`最大${maxSize}cm`);
    }
    return parts.join(' / ');
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>釣行記録がありません。</p>
        <p className="text-sm mt-1">「新規追加」ボタンから記録を追加しましょう。</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              日付
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              釣り場
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              時間
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ターゲット
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              タックルセット
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              釣果
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              メモ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={() => onRowClick(log.id)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatDate(log.date)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="font-medium text-gray-900">{log.spotName || '-'}</div>
                <div className="text-xs text-gray-500">
                  {log.area ? getAreaName(log.area) || log.area : '-'}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {formatTime(log.startTime, log.endTime)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {log.mainTarget || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {log.tackleSetName || '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span
                  className={`${
                    log.totalCatch > 0 ? 'text-brand-primary font-medium' : 'text-gray-400'
                  }`}
                >
                  {formatCatchSummary(log.totalCatch, log.maxSize)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center">
                {log.hasMemo && <FileText className="w-4 h-4 text-gray-400 inline-block" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
