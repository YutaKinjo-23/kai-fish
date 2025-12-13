// scripts/line/createRichMenu.ts
// リッチメニュー作成スクリプト
// 実行: npx ts-node scripts/line/createRichMenu.ts

import * as fs from 'fs';
import * as path from 'path';

const LINE_API_BASE = 'https://api.line.me/v2/bot';

interface RichMenuArea {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action: {
    type: 'postback' | 'uri' | 'message';
    data?: string;
    text?: string;
    uri?: string;
  };
}

interface RichMenuObject {
  size: {
    width: number;
    height: number;
  };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: RichMenuArea[];
}

// 5ボタンレイアウト（2500×1686px）
// ┌──────────┬──────────┐
// │  START   │   HIT    │  (上段: 各1250×843)
// ├──────────┼──────────┤
// │   END    │   RIG    │  (中段: 各1250×421)
// ├──────────┴──────────┤
// │      位置送信       │  (下段: 2500×422)
// └─────────────────────┘

const RICH_MENU_CONFIG: RichMenuObject = {
  size: {
    width: 2500,
    height: 1686,
  },
  selected: true,
  name: 'KAI釣行記録メニュー',
  chatBarText: '釣行記録',
  areas: [
    // START（左上）
    {
      bounds: { x: 0, y: 0, width: 1250, height: 843 },
      action: { type: 'postback', data: 'action=START', text: '開始' },
    },
    // HIT（右上）
    {
      bounds: { x: 1250, y: 0, width: 1250, height: 843 },
      action: { type: 'postback', data: 'action=HIT', text: 'HIT' },
    },
    // END（左中）
    {
      bounds: { x: 0, y: 843, width: 1250, height: 421 },
      action: { type: 'postback', data: 'action=END', text: '終了' },
    },
    // RIG_CHANGED（右中）
    {
      bounds: { x: 1250, y: 843, width: 1250, height: 421 },
      action: { type: 'postback', data: 'action=RIG_CHANGED', text: '仕掛け変更' },
    },
    // LOCATION（下段全幅）
    {
      bounds: { x: 0, y: 1264, width: 2500, height: 422 },
      action: { type: 'postback', data: 'action=LOCATION', text: '位置送信' },
    },
  ],
};

async function createRichMenu(accessToken: string): Promise<string> {
  console.log('📝 リッチメニューを作成中...');

  const res = await fetch(`${LINE_API_BASE}/richmenu`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(RICH_MENU_CONFIG),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`リッチメニュー作成失敗: ${res.status} ${error}`);
  }

  const data = await res.json();
  console.log(`✅ リッチメニュー作成完了: ${data.richMenuId}`);
  return data.richMenuId;
}

async function uploadRichMenuImage(
  accessToken: string,
  richMenuId: string,
  imagePath: string
): Promise<void> {
  console.log(`📤 画像をアップロード中: ${imagePath}`);

  const imageBuffer = fs.readFileSync(imagePath);
  const contentType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // 画像アップロードはDATA APIを使用
  const res = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
    },
    body: imageBuffer,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`画像アップロード失敗: ${res.status} ${error}`);
  }

  console.log('✅ 画像アップロード完了');
}

async function setDefaultRichMenu(accessToken: string, richMenuId: string): Promise<void> {
  console.log('🔧 デフォルトメニューに設定中...');

  const res = await fetch(`${LINE_API_BASE}/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`デフォルト設定失敗: ${res.status} ${error}`);
  }

  console.log('✅ デフォルトメニュー設定完了');
}

async function listRichMenus(accessToken: string): Promise<void> {
  console.log('📋 既存のリッチメニュー一覧:');

  const res = await fetch(`${LINE_API_BASE}/richmenu/list`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`一覧取得失敗: ${res.status} ${error}`);
  }

  const data = await res.json();
  if (data.richmenus?.length === 0) {
    console.log('  (なし)');
  } else {
    for (const menu of data.richmenus || []) {
      console.log(`  - ${menu.richMenuId}: ${menu.name}`);
    }
  }
}

async function deleteRichMenu(accessToken: string, richMenuId: string): Promise<void> {
  console.log(`🗑️ リッチメニューを削除中: ${richMenuId}`);

  const res = await fetch(`${LINE_API_BASE}/richmenu/${richMenuId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`削除失敗: ${res.status} ${error}`);
  }

  console.log('✅ 削除完了');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'create';

  // generate-placeholderはトークン不要
  if (command === 'generate-placeholder') {
    console.log('🎨 仮画像を生成中...');
    await generatePlaceholderImage();
    console.log('✅ 仮画像を生成しました: assets/line/richmenu/richmenu.png');
    return;
  }

  // 環境変数から取得
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'create': {
        // 画像パス（引数で指定 or デフォルト）
        const imagePath =
          args[1] || path.join(__dirname, '../../assets/line/richmenu/richmenu.png');

        if (!fs.existsSync(imagePath)) {
          console.error(`❌ 画像ファイルが見つかりません: ${imagePath}`);
          console.log(
            '  仮画像を生成するには: pnpm tsx scripts/line/createRichMenu.ts generate-placeholder'
          );
          process.exit(1);
        }

        const richMenuId = await createRichMenu(accessToken);
        await uploadRichMenuImage(accessToken, richMenuId, imagePath);
        await setDefaultRichMenu(accessToken, richMenuId);

        console.log('\n🎉 リッチメニューのセットアップが完了しました！');
        console.log(`   リッチメニューID: ${richMenuId}`);
        break;
      }

      case 'list': {
        await listRichMenus(accessToken);
        break;
      }

      case 'delete': {
        const richMenuId = args[1];
        if (!richMenuId) {
          console.error('❌ 削除するリッチメニューIDを指定してください');
          console.log('  使い方: pnpm tsx scripts/line/createRichMenu.ts delete <richMenuId>');
          process.exit(1);
        }
        await deleteRichMenu(accessToken, richMenuId);
        break;
      }

      default:
        console.log(`
使い方:
  pnpm tsx scripts/line/createRichMenu.ts [command] [options]

コマンド:
  create [imagePath]       リッチメニューを作成（デフォルト）
  list                     既存のリッチメニュー一覧
  delete <richMenuId>      リッチメニューを削除
  generate-placeholder     仮画像を生成（トークン不要）
        `);
    }
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

// 仮画像生成（Canvas使用）
async function generatePlaceholderImage(): Promise<void> {
  // Node.js環境でCanvas使えない場合用のSVG→PNG変換
  const { createCanvas } = await import('canvas');

  const width = 2500;
  const height = 1686;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#1a365d';
  ctx.fillRect(0, 0, width, height);

  // ボタン描画関数
  const drawButton = (
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    emoji: string,
    color: string
  ) => {
    // ボタン背景
    ctx.fillStyle = color;
    ctx.fillRect(x + 10, y + 10, w - 20, h - 20);

    // 角丸風の見た目
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);

    // テキスト
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + w / 2, y + h / 2 - 50);
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText(text, x + w / 2, y + h / 2 + 50);
  };

  // 各ボタンを描画
  drawButton(0, 0, 1250, 843, 'START', '🎣', '#2563eb');
  drawButton(1250, 0, 1250, 843, 'HIT', '🐟', '#059669');
  drawButton(0, 843, 1250, 421, 'END', '✅', '#6b7280');
  drawButton(1250, 843, 1250, 421, '仕掛け交換', '🔧', '#d97706');
  drawButton(0, 1264, 2500, 422, '位置送信', '📍', '#7c3aed');

  // ファイル保存
  const outputPath = path.join(__dirname, '../../assets/line/richmenu/richmenu.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

main();
