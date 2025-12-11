/**
 * リグ種別マスター
 */
export interface RigType {
  id: string;
  name: string;
}

export const RIG_TYPES_MASTER: RigType[] = [
  { id: 'texas', name: 'テキサスリグ' },
  { id: 'free', name: 'フリーリグ' },
  { id: 'bifuteki', name: 'ビフテキリグ' },
  { id: 'jighead', name: 'ジグヘッドリグ' },
  { id: 'drop_shot', name: 'ダウンショットリグ' },
  { id: 'carolina', name: 'キャロライナリグ' },
  { id: 'neko', name: 'ネコリグ' },
  { id: 'wacky', name: 'ワッキーリグ' },
  { id: 'nosinker', name: 'ノーシンカーリグ' },
  { id: 'split_shot', name: 'スプリットショットリグ' },
  { id: 'other', name: 'その他' },
];

/**
 * リグ種別名を取得
 */
export function getRigTypeName(id: string): string | undefined {
  return RIG_TYPES_MASTER.find((r) => r.id === id)?.name;
}
