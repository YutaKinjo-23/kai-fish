/**
 * 魚種マスター
 * kanji: 漢字表記（ない場合はnull）
 * kana: カタカナ表記（表示用）
 */
export interface FishSpecies {
  id: string;
  kanji: string | null;
  kana: string;
}

export const FISH_SPECIES_MASTER: FishSpecies[] = [
  // ロックフィッシュ系
  { id: 'kasago', kanji: '笠子', kana: 'カサゴ' },
  { id: 'mebaru', kanji: '眼張', kana: 'メバル' },
  { id: 'ainame', kanji: '鮎並', kana: 'アイナメ' },
  { id: 'soi', kanji: '曹以', kana: 'ソイ' },
  { id: 'takanohadai', kanji: '鷹羽鯛', kana: 'タカノハダイ' },

  // ハタ・ソイ系ロックフィッシュ
  { id: 'hata', kanji: '羽太', kana: 'ハタ' },
  { id: 'mahata', kanji: '真羽太', kana: 'マハタ' },
  { id: 'akahata', kanji: '赤羽太', kana: 'アカハタ' },
  { id: 'kijihata', kanji: '雉子羽太', kana: 'キジハタ' },
  { id: 'kue', kanji: '九絵', kana: 'クエ' },
  { id: 'murasoi', kanji: '斑曹以', kana: 'ムラソイ' },
  { id: 'kuro_soi', kanji: '黒曹以', kana: 'クロソイ' },

  // 青物・回遊魚
  { id: 'aji', kanji: '鯵', kana: 'アジ' },
  { id: 'saba', kanji: '鯖', kana: 'サバ' },
  { id: 'iwashi', kanji: '鰯', kana: 'イワシ' },
  { id: 'buri', kanji: '鰤', kana: 'ブリ' },
  { id: 'hamachi', kanji: '魬', kana: 'ハマチ' },
  { id: 'inada', kanji: '鰍', kana: 'イナダ' },
  { id: 'kampachi', kanji: '間八', kana: 'カンパチ' },
  { id: 'hiramasa', kanji: '平政', kana: 'ヒラマサ' },
  { id: 'sawara', kanji: '鰆', kana: 'サワラ' },
  { id: 'shiira', kanji: '鱪', kana: 'シイラ' },

  // シーバス・フラットフィッシュ
  { id: 'suzuki', kanji: '鱸', kana: 'スズキ' },
  { id: 'hirame', kanji: '鮃', kana: 'ヒラメ' },
  { id: 'magochikarei', kanji: '鰈', kana: 'カレイ' },
  { id: 'magochi', kanji: '真鯒', kana: 'マゴチ' },

  // タイ系
  { id: 'madai', kanji: '真鯛', kana: 'マダイ' },
  { id: 'kurodai', kanji: '黒鯛', kana: 'クロダイ' },
  { id: 'kibire', kanji: '黄鰭', kana: 'キビレ' },
  { id: 'ishidai', kanji: '石鯛', kana: 'イシダイ' },

  // キス・ハゼ系
  { id: 'kisu', kanji: '鱚', kana: 'キス' },
  { id: 'haze', kanji: '鯊', kana: 'ハゼ' },
  { id: 'mahaze', kanji: '真鯊', kana: 'マハゼ' },

  // イカ・タコ
  { id: 'aori_ika', kanji: '障泥烏賊', kana: 'アオリイカ' },
  { id: 'ken_saki_ika', kanji: '剣先烏賊', kana: 'ケンサキイカ' },
  { id: 'yari_ika', kanji: '槍烏賊', kana: 'ヤリイカ' },
  { id: 'surume_ika', kanji: '鯣烏賊', kana: 'スルメイカ' },
  { id: 'tako', kanji: '蛸', kana: 'タコ' },
  { id: 'madako', kanji: '真蛸', kana: 'マダコ' },

  // その他人気魚種
  { id: 'kawahagikarei', kanji: '皮剥', kana: 'カワハギ' },
  { id: 'fugu', kanji: '河豚', kana: 'フグ' },
  { id: 'anago', kanji: '穴子', kana: 'アナゴ' },
  { id: 'unagi', kanji: '鰻', kana: 'ウナギ' },
  { id: 'kochi', kanji: '鯒', kana: 'コチ' },
  { id: 'ayu', kanji: '鮎', kana: 'アユ' },

  // バス（漢字なし）
  { id: 'black_bass', kanji: null, kana: 'ブラックバス' },
  { id: 'smallmouth_bass', kanji: null, kana: 'スモールマウスバス' },

  // トラウト系
  { id: 'nijimasu', kanji: '虹鱒', kana: 'ニジマス' },
  { id: 'yamame', kanji: '山女', kana: 'ヤマメ' },
  { id: 'iwana', kanji: '岩魚', kana: 'イワナ' },
  { id: 'amago', kanji: '雨子', kana: 'アマゴ' },

  // 根魚・その他
  { id: 'okoze', kanji: '虎魚', kana: 'オコゼ' },
  { id: 'meijina', kanji: '眼仁奈', kana: 'メジナ' },
  { id: 'isaki', kanji: '伊佐木', kana: 'イサキ' },
  { id: 'hokke', kanji: '𩸽', kana: 'ホッケ' },
  { id: 'tobiuo', kanji: '飛魚', kana: 'トビウオ' },
  { id: 'managatsuo', kanji: '真魚鰹', kana: 'マナガツオ' },
  { id: 'katsuo', kanji: '鰹', kana: 'カツオ' },
  { id: 'maguro', kanji: '鮪', kana: 'マグロ' },
];

/**
 * カタカナ表記を取得
 */
export function getFishKana(id: string): string | undefined {
  return FISH_SPECIES_MASTER.find((f) => f.id === id)?.kana;
}

/**
 * 漢字表記を取得（ない場合はカタカナを返す）
 */
export function getFishDisplay(id: string): string | undefined {
  const fish = FISH_SPECIES_MASTER.find((f) => f.id === id);
  return fish?.kanji ?? fish?.kana;
}

/**
 * キーワードで魚種を検索（カタカナ・漢字両方で部分一致）
 */
export function searchFishSpecies(keyword: string): FishSpecies[] {
  if (!keyword) return FISH_SPECIES_MASTER;
  const lower = keyword.toLowerCase();
  return FISH_SPECIES_MASTER.filter(
    (f) =>
      f.kana.includes(keyword) || (f.kanji && f.kanji.includes(keyword)) || f.id.includes(lower)
  );
}
