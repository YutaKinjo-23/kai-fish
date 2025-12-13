// src/app/api/line/webhook/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLineSignature } from '@/lib/line/signature';
import { LineClient } from '@/lib/line/client';
import { saveLineBinaryToLocal } from '@/lib/storage/localStorage';

// ========================================
// LINE Webhook Event Types
// ========================================

type LineEventBase = {
  type: string;
  timestamp: number;
  replyToken?: string;
  source: { type: 'user'; userId: string };
};

type LinePostbackEvent = LineEventBase & {
  type: 'postback';
  postback: { data: string };
};

type LineMessageEvent = LineEventBase & {
  type: 'message';
  message:
    | { id: string; type: 'image' }
    | { id: string; type: 'location'; latitude: number; longitude: number; address?: string }
    | { id: string; type: 'text'; text: string };
};

// ========================================
// Helper Functions
// ========================================

function parsePostbackData(data: string): Record<string, string> {
  // 例: "action=HIT" or "action=RIG_CHANGED&v=1"
  return Object.fromEntries(new URLSearchParams(data).entries());
}

function fromLineTimestamp(ts: number): Date {
  return new Date(ts);
}

/**
 * LINEユーザーIDからアプリのユーザーIDを取得
 * 連携されていない場合はnullを返す
 */
async function getUserIdByLineUserId(lineUserId: string): Promise<string | null> {
  const account = await prisma.lineAccount.findUnique({
    where: { lineUserId },
    select: { userId: true },
  });
  return account?.userId ?? null;
}

/**
 * アクティブなセッションを取得または新規作成
 */
async function getOrCreateActiveSession(params: {
  userId: string;
}): Promise<{ id: string; isNew: boolean }> {
  const existing = await prisma.lineFishingSession.findFirst({
    where: { userId: params.userId, endedAt: null, source: 'LINE' },
    orderBy: { startedAt: 'desc' },
    select: { id: true },
  });

  if (existing) {
    return { id: existing.id, isNew: false };
  }

  const created = await prisma.lineFishingSession.create({
    data: {
      userId: params.userId,
      source: 'LINE',
      startedAt: new Date(),
      lastEventAt: new Date(),
    },
    select: { id: true },
  });

  return { id: created.id, isNew: true };
}

// ========================================
// Postback Action Handlers
// ========================================

type PostbackContext = {
  userId: string;
  sessionId: string;
  occurredAt: Date;
  action: string;
  params: Record<string, string>;
  replyToken?: string;
  line: LineClient;
};

async function handleStartAction(ctx: PostbackContext): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'START',
      occurredAt: ctx.occurredAt,
      payload: { action: ctx.action },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: '🎣 釣行を開始しました！\n\n位置情報を送ると環境データが取れます。\n釣れたらHIT、根掛かりはSNAGボタンを押してください。',
    });
  }
}

async function handleEndAction(ctx: PostbackContext): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'END',
      occurredAt: ctx.occurredAt,
      payload: { action: ctx.action },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: {
      lastEventAt: ctx.occurredAt,
      endedAt: ctx.occurredAt,
      autoEnded: false,
    },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: '✅ 釣行を終了しました。\n\nお疲れ様でした！WebアプリのDashboardで記録を確認できます。',
    });
  }
}

async function handleHitAction(ctx: PostbackContext): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'HIT',
      occurredAt: ctx.occurredAt,
      payload: { action: ctx.action, params: ctx.params },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: '🐟 釣れたとして記録しました！\n\n写真があれば送ってください（任意）。',
    });
  }
}

async function handleSnagAction(ctx: PostbackContext): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'SNAG',
      occurredAt: ctx.occurredAt,
      payload: { action: ctx.action, params: ctx.params },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: '⚠️ 根掛かりとして記録しました。\n\n状況が分かる写真があれば送ってください（任意）。',
    });
  }
}

async function handleRigChangedAction(ctx: PostbackContext): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'RIG_CHANGED',
      occurredAt: ctx.occurredAt,
      payload: { action: ctx.action, params: ctx.params },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: '🔧 仕掛け変更を記録しました。\n\n仕掛けの写真を送ると後で紐付けできます（任意）。',
    });
  }
}

async function handleLocationPromptAction(ctx: PostbackContext): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'LOCATION_PROMPT',
      occurredAt: ctx.occurredAt,
      payload: { action: ctx.action, params: ctx.params },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: '📍 位置情報を送ってください。\n\nLINEの「＋」→「位置情報」から現在地を共有できます。',
    });
  }
}

async function handleUnknownPostback(ctx: PostbackContext): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'POSTBACK',
      occurredAt: ctx.occurredAt,
      payload: { action: ctx.action, params: ctx.params },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });
}

// ========================================
// Message Handlers
// ========================================

type MessageContext = {
  userId: string;
  sessionId: string;
  occurredAt: Date;
  replyToken?: string;
  line: LineClient;
  uploadBaseDir: string;
};

async function handleLocationMessage(
  ctx: MessageContext,
  location: { latitude: number; longitude: number; address?: string }
): Promise<void> {
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'LOCATION',
      occurredAt: ctx.occurredAt,
      payload: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address ?? null,
      },
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: `📍 位置を記録しました。\n\n緯度: ${location.latitude.toFixed(6)}\n経度: ${location.longitude.toFixed(6)}`,
    });
  }
}

async function handleImageMessage(ctx: MessageContext, messageId: string): Promise<void> {
  // LINE APIから画像を取得
  const { bytes, mimeType } = await ctx.line.getMessageContent({ messageId });

  // ローカルに保存
  const saved = await saveLineBinaryToLocal({
    baseDir: ctx.uploadBaseDir,
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    messageId,
    mimeType,
    bytes,
  });

  // イベント作成
  const createdEvent = await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      source: 'LINE',
      type: 'IMAGE',
      occurredAt: ctx.occurredAt,
      payload: { messageId, mimeType },
    },
    select: { id: true },
  });

  // 画像アセット作成
  await prisma.imageAsset.create({
    data: {
      userId: ctx.userId,
      sessionId: ctx.sessionId,
      eventId: createdEvent.id,
      source: 'LINE',
      messageId,
      localPath: saved.localPath,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
    },
  });

  await prisma.lineFishingSession.update({
    where: { id: ctx.sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: '📷 写真を記録しました。',
    });
  }
}

// ========================================
// Main Webhook Handler
// ========================================

export async function POST(req: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const uploadBaseDir = process.env.LINE_UPLOAD_BASEDIR;

  if (!channelSecret || !accessToken || !uploadBaseDir) {
    console.error('[LINE Webhook] Missing environment variables');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  // リクエストボディをテキストで取得（署名検証用）
  const body = await req.text();
  const signature = req.headers.get('x-line-signature');

  // 署名検証
  if (!verifyLineSignature({ channelSecret, body, signature })) {
    console.warn('[LINE Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload: { events?: unknown[] } = JSON.parse(body);
  const events = Array.isArray(payload.events) ? payload.events : [];

  const line = new LineClient(accessToken);

  for (const e of events) {
    try {
      const event = e as Partial<LineEventBase>;

      // ソースがユーザーでない場合はスキップ
      if (!event.source || event.source.type !== 'user' || !event.source.userId || !event.type) {
        continue;
      }

      const lineUserId = event.source.userId;
      const userId = await getUserIdByLineUserId(lineUserId);

      // 紐付けできない場合は案内を返す
      if (!userId) {
        if (event.replyToken) {
          await line.replyText({
            replyToken: event.replyToken,
            text: '⚠️ LINE連携が設定されていません。\n\nWebアプリにログインして「設定→LINE連携」から連携を有効にしてください。',
          });
        }
        continue;
      }

      // アクティブなセッションを取得または作成
      const session = await getOrCreateActiveSession({ userId });

      // イベント時刻
      const occurredAt =
        typeof event.timestamp === 'number' ? fromLineTimestamp(event.timestamp) : new Date();

      // Postbackイベント処理
      if (event.type === 'postback') {
        const pb = e as LinePostbackEvent;
        const data = pb.postback?.data ?? '';
        const params = parsePostbackData(data);
        const action = params.action ?? 'UNKNOWN';

        const ctx: PostbackContext = {
          userId,
          sessionId: session.id,
          occurredAt,
          action,
          params,
          replyToken: pb.replyToken,
          line,
        };

        switch (action) {
          case 'START':
            await handleStartAction(ctx);
            break;
          case 'END':
            await handleEndAction(ctx);
            break;
          case 'HIT':
            await handleHitAction(ctx);
            break;
          case 'SNAG':
            await handleSnagAction(ctx);
            break;
          case 'RIG_CHANGED':
            await handleRigChangedAction(ctx);
            break;
          case 'LOCATION':
            await handleLocationPromptAction(ctx);
            break;
          default:
            await handleUnknownPostback(ctx);
        }
        continue;
      }

      // Messageイベント処理
      if (event.type === 'message') {
        const me = e as LineMessageEvent;
        const msgCtx: MessageContext = {
          userId,
          sessionId: session.id,
          occurredAt,
          replyToken: me.replyToken,
          line,
          uploadBaseDir,
        };

        if (me.message?.type === 'location') {
          await handleLocationMessage(msgCtx, {
            latitude: me.message.latitude,
            longitude: me.message.longitude,
            address: me.message.address,
          });
          continue;
        }

        if (me.message?.type === 'image') {
          await handleImageMessage(msgCtx, me.message.id);
          continue;
        }

        // テキストメッセージ（将来の拡張用）
        if (me.message?.type === 'text') {
          // 現在は何もしない（将来的にAI連携などで使用）
          continue;
        }
      }
    } catch (error) {
      // 個別イベントのエラーは記録して続行
      console.error('[LINE Webhook] Event processing error:', error);
    }
  }

  return NextResponse.json({ ok: true });
}
