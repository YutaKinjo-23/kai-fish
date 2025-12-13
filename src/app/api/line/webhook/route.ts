// src/app/api/line/webhook/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLineSignature } from '@/lib/line/signature';
import { LineClient, QuickReplyItem } from '@/lib/line/client';
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

/**
 * 過去の釣行から最近使用したスポットを取得（最大10件）
 */
async function getRecentSpots(userId: string): Promise<Array<{ spotName: string; area: string }>> {
  // FishingEventからスポット情報（type='spot'）を最近の順で取得
  const events = await prisma.fishingEvent.findMany({
    where: {
      fishingLog: { userId },
      type: 'spot',
      spotName: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    select: { spotName: true, area: true },
    take: 30, // 重複除去前に多めに取得
  });

  // 重複除去（spotName + areaでユニーク化）
  const seen = new Set<string>();
  const unique: Array<{ spotName: string; area: string }> = [];
  for (const e of events) {
    if (!e.spotName) continue;
    const key = `${e.spotName}|${e.area ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ spotName: e.spotName, area: e.area ?? '' });
    if (unique.length >= 10) break;
  }

  return unique;
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
  // 既にアクティブなセッションがある場合は案内
  const activeSession = await prisma.lineFishingSession.findFirst({
    where: { userId: ctx.userId, endedAt: null, source: 'LINE' },
  });

  if (activeSession) {
    if (ctx.replyToken) {
      await ctx.line.replyText({
        replyToken: ctx.replyToken,
        text: '⚠️ 既に釣行中です。\n\n終了するには「END」ボタンを押してください。',
      });
    }
    return;
  }

  // 過去のスポットを取得
  const recentSpots = await getRecentSpots(ctx.userId);

  // クイックリプライを構築
  const quickReplyItems: QuickReplyItem[] = [
    // 位置情報送信ボタン（必ず先頭に）
    {
      type: 'action',
      action: { type: 'location', label: '📍 位置情報を送信' },
    },
  ];

  // 過去スポットをpostbackボタンとして追加（最大12件、合計13件まで）
  for (const spot of recentSpots.slice(0, 12)) {
    const label = spot.spotName.length > 17 ? spot.spotName.slice(0, 16) + '…' : spot.spotName;
    quickReplyItems.push({
      type: 'action',
      action: {
        type: 'postback',
        label: `🎣 ${label}`,
        data: `action=START_AT_SPOT&spot=${encodeURIComponent(spot.spotName)}&area=${encodeURIComponent(spot.area)}`,
        displayText: spot.spotName,
      },
    });
  }

  if (ctx.replyToken) {
    await ctx.line.replyWithQuickReply({
      replyToken: ctx.replyToken,
      text: '🎣 どこで釣行を開始しますか？\n\n位置情報を送信するか、過去のスポットを選んでください。',
      quickReply: { items: quickReplyItems },
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

/**
 * START_AT_SPOT: 過去のスポットを選択して釣行開始
 */
async function handleStartAtSpotAction(ctx: PostbackContext): Promise<void> {
  const spotName = ctx.params.spot ? decodeURIComponent(ctx.params.spot) : null;
  const area = ctx.params.area ? decodeURIComponent(ctx.params.area) : null;

  if (!spotName) {
    if (ctx.replyToken) {
      await ctx.line.replyText({
        replyToken: ctx.replyToken,
        text: '⚠️ スポット情報が取得できませんでした。',
      });
    }
    return;
  }

  // 新しいセッションを作成
  const newSession = await prisma.lineFishingSession.create({
    data: {
      userId: ctx.userId,
      source: 'LINE',
      startedAt: ctx.occurredAt,
      lastEventAt: ctx.occurredAt,
    },
    select: { id: true },
  });

  // STARTイベント
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: newSession.id,
      source: 'LINE',
      type: 'START',
      occurredAt: ctx.occurredAt,
      payload: { action: 'START_AT_SPOT', spotName, area },
    },
  });

  // SPOTイベント（スポット情報を記録）
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId: newSession.id,
      source: 'LINE',
      type: 'SPOT',
      occurredAt: ctx.occurredAt,
      payload: { spotName, area },
    },
  });

  if (ctx.replyToken) {
    const areaText = area ? `（${area}）` : '';
    await ctx.line.replyText({
      replyToken: ctx.replyToken,
      text: `🎣 ${spotName}${areaText}で釣行を開始しました！\n\n釣れたら「HIT」、仕掛けを変えたら「仕掛け交換」ボタンを押してください。`,
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
  sessionId: string | null; // nullの場合はセッション未開始
  occurredAt: Date;
  replyToken?: string;
  line: LineClient;
  uploadBaseDir: string;
};

/**
 * 位置情報メッセージ処理
 * セッションがなければ新規作成してSTART + LOCATION
 */
async function handleLocationMessage(
  ctx: MessageContext,
  location: { latitude: number; longitude: number; address?: string }
): Promise<void> {
  let sessionId = ctx.sessionId;
  let isNewSession = false;

  // セッションがない場合は新規作成
  if (!sessionId) {
    const newSession = await prisma.lineFishingSession.create({
      data: {
        userId: ctx.userId,
        source: 'LINE',
        startedAt: ctx.occurredAt,
        lastEventAt: ctx.occurredAt,
      },
      select: { id: true },
    });
    sessionId = newSession.id;
    isNewSession = true;

    // STARTイベント
    await prisma.lineFishingEvent.create({
      data: {
        userId: ctx.userId,
        sessionId,
        source: 'LINE',
        type: 'START',
        occurredAt: ctx.occurredAt,
        payload: { action: 'START_WITH_LOCATION' },
      },
    });
  }

  // LOCATIONイベント
  await prisma.lineFishingEvent.create({
    data: {
      userId: ctx.userId,
      sessionId,
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
    where: { id: sessionId },
    data: { lastEventAt: ctx.occurredAt },
  });

  if (ctx.replyToken) {
    if (isNewSession) {
      const addressText = location.address ? `\n${location.address}` : '';
      await ctx.line.replyText({
        replyToken: ctx.replyToken,
        text: `🎣 釣行を開始しました！${addressText}\n\n釣れたら「HIT」、仕掛けを変えたら「仕掛け交換」ボタンを押してください。`,
      });
    } else {
      await ctx.line.replyText({
        replyToken: ctx.replyToken,
        text: `📍 位置を記録しました。\n\n緯度: ${location.latitude.toFixed(6)}\n経度: ${location.longitude.toFixed(6)}`,
      });
    }
  }
}

async function handleImageMessage(
  ctx: MessageContext & { sessionId: string },
  messageId: string
): Promise<void> {
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

      // イベント時刻
      const occurredAt =
        typeof event.timestamp === 'number' ? fromLineTimestamp(event.timestamp) : new Date();

      // Postbackイベント処理
      if (event.type === 'postback') {
        const pb = e as LinePostbackEvent;
        const data = pb.postback?.data ?? '';
        const params = parsePostbackData(data);
        const action = params.action ?? 'UNKNOWN';

        // PostbackイベントはSTART以外はセッションが必要
        // STARTとSTART_AT_SPOTは自分でセッション管理する
        const needsSession = !['START', 'START_AT_SPOT'].includes(action);
        let sessionId: string | null = null;

        if (needsSession) {
          const session = await getOrCreateActiveSession({ userId });
          sessionId = session.id;
        }

        const ctx: PostbackContext = {
          userId,
          sessionId: sessionId ?? '', // START系は使わない
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
          case 'START_AT_SPOT':
            await handleStartAtSpotAction(ctx);
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

        // アクティブセッションを取得（存在すれば）
        const activeSession = await prisma.lineFishingSession.findFirst({
          where: { userId, endedAt: null, source: 'LINE' },
          orderBy: { startedAt: 'desc' },
          select: { id: true },
        });

        const msgCtx: MessageContext = {
          userId,
          sessionId: activeSession?.id ?? null,
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
          // 画像はセッションが必要
          if (!msgCtx.sessionId) {
            if (me.replyToken) {
              await line.replyText({
                replyToken: me.replyToken,
                text: '📷 写真を記録するには先に「START」ボタンで釣行を開始してください。',
              });
            }
            continue;
          }
          await handleImageMessage({ ...msgCtx, sessionId: msgCtx.sessionId }, me.message.id);
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
