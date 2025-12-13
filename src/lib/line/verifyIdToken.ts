// src/lib/line/verifyIdToken.ts

/**
 * LIFF IDトークンを検証してLINEユーザー情報を取得
 * @see https://developers.line.biz/ja/reference/line-login/#verify-id-token
 */
export interface LineIdTokenPayload {
  iss: string; // https://access.line.me
  sub: string; // lineUserId
  aud: string; // Channel ID
  exp: number; // 有効期限
  iat: number; // 発行時刻
  name?: string; // 表示名
  picture?: string; // プロフィール画像URL
}

export interface VerifyIdTokenResult {
  success: true;
  payload: LineIdTokenPayload;
}

export interface VerifyIdTokenError {
  success: false;
  error: string;
}

/**
 * LINE IDトークンを検証
 * @param idToken - LIFFから取得したIDトークン
 * @returns 検証結果（成功時はlineUserIdを含むペイロード）
 */
export async function verifyLineIdToken(
  idToken: string
): Promise<VerifyIdTokenResult | VerifyIdTokenError> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;

  if (!channelId) {
    console.error('[LINE ID Token] LINE_LOGIN_CHANNEL_ID is not configured');
    return { success: false, error: 'Server not configured' };
  }

  try {
    const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: channelId,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      console.warn('[LINE ID Token] Verification failed:', res.status, errorBody);
      return { success: false, error: 'Invalid ID token' };
    }

    const payload: LineIdTokenPayload = await res.json();

    // issuerの検証
    if (payload.iss !== 'https://access.line.me') {
      return { success: false, error: 'Invalid issuer' };
    }

    // audienceの検証（Channel IDと一致するか）
    if (payload.aud !== channelId) {
      return { success: false, error: 'Invalid audience' };
    }

    // 有効期限の検証
    if (payload.exp * 1000 < Date.now()) {
      return { success: false, error: 'Token expired' };
    }

    return { success: true, payload };
  } catch (error) {
    console.error('[LINE ID Token] Verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
}
