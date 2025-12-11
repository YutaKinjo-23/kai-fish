/**
 * エリアマスター
 * 三河湾・渥美半島周辺を中心としたエリア（市・郡・区単位）
 */
export interface Area {
  id: string;
  name: string;
}

export const AREAS_MASTER: Area[] = [
  // 市
  { id: 'toyohashi', name: '豊橋市' },
  { id: 'gamagori', name: '蒲郡市' },
  { id: 'tahara', name: '田原市' },
  { id: 'nishio', name: '西尾市' },
  { id: 'okazaki', name: '岡崎市' },
  { id: 'hekinan', name: '碧南市' },
  { id: 'takahama', name: '高浜市' },
  { id: 'handa', name: '半田市' },
  { id: 'tokoname', name: '常滑市' },
  // 郡
  { id: 'nukata', name: '額田郡' },
  { id: 'chita', name: '知多郡' },
  // その他
  { id: 'other', name: 'その他' },
];

/**
 * エリア名を取得
 */
export function getAreaName(id: string): string | undefined {
  return AREAS_MASTER.find((a) => a.id === id)?.name;
}
