// src/lib/line/client.ts

export interface LineTextMessage {
  type: 'text';
  text: string;
}

// LINE メッセージ型（テキスト以外も対応可能に）
export type LineMessage = LineTextMessage;

// クイックリプライアイテム
export interface QuickReplyItem {
  type: 'action';
  action:
    | { type: 'postback'; label: string; data: string; displayText?: string }
    | { type: 'location'; label: string }
    | { type: 'message'; label: string; text: string };
}

export interface QuickReply {
  items: QuickReplyItem[];
}

/**
 * LINE Messaging API クライアント
 */
export class LineClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * リプライメッセージを送信
   */
  async replyText(params: { replyToken: string; text: string }): Promise<void> {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replyToken: params.replyToken,
        messages: [{ type: 'text', text: params.text }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LINE reply failed: ${res.status} ${body}`);
    }
  }

  /**
   * クイックリプライ付きでテキストを送信
   */
  async replyWithQuickReply(params: {
    replyToken: string;
    text: string;
    quickReply: QuickReply;
  }): Promise<void> {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replyToken: params.replyToken,
        messages: [
          {
            type: 'text',
            text: params.text,
            quickReply: params.quickReply,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LINE reply failed: ${res.status} ${body}`);
    }
  }

  /**
   * 複数メッセージをリプライ
   */
  async replyMessages(params: { replyToken: string; messages: LineMessage[] }): Promise<void> {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replyToken: params.replyToken,
        messages: params.messages,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LINE reply failed: ${res.status} ${body}`);
    }
  }

  /**
   * メッセージコンテンツ（画像・動画等）を取得
   * @see https://developers.line.biz/ja/reference/messaging-api/#get-content
   */
  async getMessageContent(params: {
    messageId: string;
  }): Promise<{ bytes: Uint8Array; mimeType: string }> {
    const res = await fetch(`https://api.line.me/v2/bot/message/${params.messageId}/content`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LINE content fetch failed: ${res.status} ${body}`);
    }

    const ab = await res.arrayBuffer();
    const mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
    return { bytes: new Uint8Array(ab), mimeType };
  }

  /**
   * ユーザープロフィールを取得
   */
  async getProfile(params: { userId: string }): Promise<{
    displayName: string;
    userId: string;
    pictureUrl?: string;
    statusMessage?: string;
  }> {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${params.userId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LINE profile fetch failed: ${res.status} ${body}`);
    }

    return res.json();
  }
}
