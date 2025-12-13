// src/lib/line/signature.ts
import crypto from 'node:crypto';

/**
 * LINE Webhookの署名を検証する
 * @see https://developers.line.biz/ja/docs/messaging-api/receiving-messages/#verifying-signatures
 */
export function verifyLineSignature(params: {
  channelSecret: string;
  body: string;
  signature: string | null;
}): boolean {
  const { channelSecret, body, signature } = params;
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', channelSecret);
  hmac.update(body);

  const digest = hmac.digest('base64');

  // timing-safe比較（長さが違うと例外になるので先に弾く）
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
