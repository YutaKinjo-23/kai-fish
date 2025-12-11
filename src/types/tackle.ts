/**
 * タックル関連の型定義
 */

// ロッド
export interface Rod {
  id: string;
  name: string;
  maker: string | null;
  lengthFt: string | null;
  power: string | null;
  lureWeightMin: number | null;
  lureWeightMax: number | null;
  egiSizeMin: string | null;
  egiSizeMax: string | null;
  lineMin: string | null;
  lineMax: string | null;
  memo: string | null;
}

// リール
export interface Reel {
  id: string;
  name: string;
  maker: string | null;
  size: string | null;
  spoolDepth: string | null;
  gearRatio: string | null;
  weight: number | null;
  spoolVariations: string | null;
}

// ライン
export interface Line {
  id: string;
  name: string;
  lineType: string;
  lineRole: string | null;
  maker: string | null;
  thickness: string | null;
  lb: string | null;
  reelId: string | null;
  usageTags: string | null;
}

// タックルセット
export interface TackleSet {
  id: string;
  name: string;
  purpose: string | null;
  rodId: string | null;
  rod: Rod | null;
  reelId: string | null;
  reel: Reel | null;
  mainLineId: string | null;
  mainLine: Line | null;
  leaderId: string | null;
  leader: Line | null;
  leaderLb: string | null;
  leaderLength: string | null;
  rigs: string | null;
  targets: string | null;
}

// フォーム用データ
export interface TackleSetFormData {
  name: string;
  purpose: string;
  rodId: string;
  reelId: string;
  mainLineId: string;
  leaderId: string;
  leaderLb: string;
  leaderLength: string;
  rigs: string[]; // 選択されたリグID配列
  targets: string[]; // 選択されたターゲットID配列
}

export interface RodFormData {
  name: string;
  maker: string;
  lengthFt: string;
  power: string;
  lureWeightMin: string;
  lureWeightMax: string;
  egiSizeMin: string;
  egiSizeMax: string;
  lineMin: string;
  lineMax: string;
  memo: string;
}

export interface ReelFormData {
  name: string;
  maker: string;
  size: string;
  spoolDepth: string;
  gearRatio: string;
  weight: string;
  spoolVariations: string;
}

export interface LineFormData {
  name: string;
  lineType: string;
  lineRole: string;
  maker: string;
  thickness: string;
  lb: string;
  reelId: string;
  usageTags: string[];
}

// ライン種別
export const LINE_TYPES = [
  { value: 'pe', label: 'PE' },
  { value: 'fluoro', label: 'フロロカーボン' },
  { value: 'nylon', label: 'ナイロン' },
  { value: 'ester', label: 'エステル' },
] as const;

// ライン用途（役割）
export const LINE_ROLES = [
  { value: 'main', label: '本線' },
  { value: 'backing', label: '下巻き' },
  { value: 'leader', label: 'リーダー' },
] as const;

// ロッドパワー
export const ROD_POWERS = [
  { value: 'UL', label: 'UL（ウルトラライト）' },
  { value: 'L', label: 'L（ライト）' },
  { value: 'ML', label: 'ML（ミディアムライト）' },
  { value: 'M', label: 'M（ミディアム）' },
  { value: 'MH', label: 'MH（ミディアムヘビー）' },
  { value: 'H', label: 'H（ヘビー）' },
  { value: 'XH', label: 'XH（エクストラヘビー）' },
] as const;

// ギア比
export const GEAR_RATIOS = [
  { value: 'PG', label: 'PG（パワーギア）' },
  { value: 'normal', label: 'ノーマル' },
  { value: 'HG', label: 'HG（ハイギア）' },
  { value: 'XG', label: 'XG（エクストラハイギア）' },
] as const;

// ライン使用用途タグ
export const LINE_USAGE_TAGS = [
  { value: 'night-rock', label: 'ナイトロック' },
  { value: 'day-rock', label: 'デイロック' },
  { value: 'eging', label: 'エギング' },
  { value: 'aji', label: 'アジング' },
  { value: 'mebaru', label: 'メバリング' },
  { value: 'seabass', label: 'シーバス' },
  { value: 'light-shore', label: 'ライトショアジギング' },
  { value: 'other', label: 'その他' },
] as const;

// ルアー種類
export const LURE_TYPES = [
  { value: 'worm', label: 'ワーム' },
  { value: 'plug', label: 'プラグ' },
  { value: 'metal-jig', label: 'メタルジグ' },
] as const;

// 推奨リグ
export const RECOMMENDED_RIGS = [
  { value: 'texas', label: 'テキサスリグ' },
  { value: 'free', label: 'フリーリグ' },
  { value: 'jighead', label: 'ジグヘッド' },
  { value: 'carolina', label: 'キャロライナ' },
  { value: 'neko', label: 'ネコリグ' },
  { value: 'ds', label: 'ダウンショット' },
  { value: 'nosinker', label: 'ノーシンカー' },
] as const;

// ルアー・ワーム
export interface Lure {
  id: string;
  lureType: string;
  maker: string | null;
  name: string;
  color: string | null;
  size: string | null;
  imageUrl: string | null;
  recommendedHook: string | null;
  recommendedRig: string | null;
  recommendedSinkerWeight: string | null;
  memo: string | null;
  rating: number | null;
  conditionMemo: string | null;
  rigExamples: string[];
  areas: string[];
  timeZones: string[];
  seasons: string[];
  tides: string[];
  waterQualities: string[];
  waterTempC: number | null;
  windDirection: string | null;
  windSpeedMs: number | null;
  stockQty: number | null;
  needRestock: boolean;
}

export interface LureFormData {
  lureType: string;
  maker: string;
  name: string;
  color: string;
  size: string;
  recommendedHook: string;
  recommendedRig: string[];
  memo: string;
  stockQty: string;
  needRestock: boolean;
}

// 小物カテゴリ
export const TERMINAL_TACKLE_CATEGORIES = [
  { value: 'hook', label: 'フック' },
  { value: 'sinker', label: 'シンカー' },
  { value: 'snap', label: 'スナップ' },
  { value: 'swivel', label: 'スイベル' },
  { value: 'other', label: 'その他' },
] as const;

// シンカー種類（参考用）
export const SINKER_TYPES = [
  { value: 'texas', label: 'テキサスシンカー' },
  { value: 'tekidan', label: 'テキダン' },
  { value: 'stick', label: 'フリーリグ用スティック' },
  { value: 'jighead', label: 'ジグヘッド' },
  { value: 'split', label: 'スプリットショット' },
  { value: 'ds', label: 'ダウンショット用' },
  { value: 'other', label: 'その他' },
] as const;

// 小物（フック・シンカー等）
export interface TerminalTackle {
  id: string;
  category: string;
  maker: string | null;
  name: string;
  size: string | null;
  weight: string | null;
  stockQty: number | null;
  needRestock: boolean;
  memo: string | null;
}

export interface TerminalTackleFormData {
  category: string;
  maker: string;
  name: string;
  size: string;
  weight: string;
  stockQty: string;
  needRestock: boolean;
  memo: string;
}
