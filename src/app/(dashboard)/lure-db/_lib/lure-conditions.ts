export const TIME_ZONES = [
  { value: 'ナイト', label: 'ナイト' },
  { value: 'デイ', label: 'デイ' },
] as const;

export const SEASONS = [
  { value: '春', label: '春' },
  { value: '夏', label: '夏' },
  { value: '秋', label: '秋' },
  { value: '冬', label: '冬' },
] as const;

export const TIDES = [
  { value: '大潮', label: '大潮' },
  { value: '中潮', label: '中潮' },
  { value: '小潮', label: '小潮' },
  { value: '長潮', label: '長潮' },
] as const;

export const WATER_QUALITIES = [
  { value: '澄み', label: '澄み' },
  { value: 'やや濁り', label: 'やや濁り' },
  { value: '濁り', label: '濁り' },
] as const;

export const LURE_DB_PRESETS = [
  {
    id: 'nishiura-night-rock-practice',
    label: '西浦ナイトロック練習用',
    filter: {
      area: '西浦',
      timeZone: 'ナイト',
    },
  },
  {
    id: 'nishiura-ranker-kasago',
    label: '西浦ランカーカサゴ狙い',
    filter: {
      area: '西浦',
      timeZone: 'ナイト',
    },
  },
] as const;
