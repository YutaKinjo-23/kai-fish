/**
 * ダッシュボード関連の型定義
 */

// 期間指定
export type DashboardRange = 'month' | 'last30' | 'all';

// 概要データ
export interface DashboardOverview {
  recentAvgHits: number | null; // 直近X回の平均ヒット数
  recentMaxSize: number | null; // 直近X回の最大サイズ
  monthTripCount: number; // 今月の釣行回数
  monthTotalHits: number; // 今月の合計釣果
}

// エリアTOP
export interface TopAreaItem {
  area: string;
  hitCount: number;
}

// ルアーTOP
export interface TopLureItem {
  lureId: string;
  label: string;
  hitCount: number;
  usageCount?: number;
}

// ヒートマップデータ
export interface HeatmapData {
  xLabels: string[]; // 日付 or 月ラベル
  yHours: number[]; // 0-23
  values: (number | null)[][]; // [時間][日付] null=未観測
}

// サイズ分布ヒストグラム
export interface SizeHistItem {
  bucketLabel: string;
  count: number;
}

// メタ情報
export interface DashboardMeta {
  range: DashboardRange;
  generatedAt: string;
  sizeUnknownCount: number; // サイズ未入力件数
}

// APIレスポンス
export interface DashboardResponse {
  overview: DashboardOverview;
  topAreas: TopAreaItem[];
  topLures: TopLureItem[];
  heatmap: HeatmapData;
  lureBar: TopLureItem[];
  sizeHist: SizeHistItem[];
  meta: DashboardMeta;
}
