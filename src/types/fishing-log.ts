/**
 * 釣行記録の型定義（タイムライン形式）
 */

// イベントタイプ
export type FishingEventType = 'start' | 'spot' | 'setup' | 'catch' | 'end';

// イベント基本形
export interface FishingEventBase {
  id?: string;
  type: FishingEventType;
  time: string; // HH:mm
  order: number;
}

// 開始イベント
export interface FishingEventStart extends FishingEventBase {
  type: 'start';
}

// スポット移動イベント
export interface FishingEventSpot extends FishingEventBase {
  type: 'spot';
  area: string;
  spotName: string;
}

// セットアップ変更イベント
export interface FishingEventSetup extends FishingEventBase {
  type: 'setup';
  target?: string | null;
  tackle?: string | null;
  rig?: string | null;
}

// 釣果イベント
export interface FishingEventCatch extends FishingEventBase {
  type: 'catch';
  speciesId: string;
  sizeCm?: number | null;
  photoUrl?: string | null;
}

// 終了イベント
export interface FishingEventEnd extends FishingEventBase {
  type: 'end';
}

// イベント共用体型
export type FishingEvent =
  | FishingEventStart
  | FishingEventSpot
  | FishingEventSetup
  | FishingEventCatch
  | FishingEventEnd;

// イベント（DB レスポンス用・全フィールド含む）
export interface FishingEventData {
  id: string;
  type: FishingEventType;
  time: string;
  order: number;
  area: string | null;
  spotName: string | null;
  target: string | null;
  tackle: string | null;
  rig: string | null;
  speciesId: string | null;
  sizeCm: number | null;
  photoUrl: string | null;
  createdAt: string;
}

// 釣行記録（フォーム用）
export interface FishingLogFormData {
  date: string; // YYYY-MM-DD
  memo?: string | null;
  events: FishingEvent[];
}

// 釣行記録（API レスポンス用）
export interface FishingLogData {
  id: string;
  date: string;
  memo: string | null;
  events: FishingEventData[];
  createdAt: string;
  updatedAt: string;
}

// 一覧用サマリ
export interface FishingLogSummary {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  // 最初のスポットイベントから取得
  spotName: string | null;
  area: string | null;
  // 最初のセットアップから取得
  mainTarget: string | null;
  tackleSetName: string | null;
  // 釣果集計
  totalCatch: number;
  maxSize: number | null;
  hasMemo: boolean;
}

// フィルタ条件
export interface FishingLogFilter {
  dateFrom?: string;
  dateTo?: string;
  area?: string;
  spot?: string;
  mainTarget?: string;
}

// ソート条件
export type FishingLogSortKey = 'date' | 'totalCatch' | 'maxSize';
export type SortOrder = 'asc' | 'desc';

export interface FishingLogSort {
  key: FishingLogSortKey;
  order: SortOrder;
}
