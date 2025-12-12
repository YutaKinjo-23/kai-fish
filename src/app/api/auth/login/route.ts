import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  validateCredentials,
  validateEmail,
} from '../_lib/store';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'email と password を指定してください。' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: 'メールアドレスの形式が正しくありません。' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'パスワードは8文字以上で入力してください。' },
      { status: 400 }
    );
  }

  const user = await validateCredentials(email, password);
  if (!user) {
    return NextResponse.json(
      { error: 'メールアドレスまたはパスワードが正しくありません。' },
      { status: 401 }
    );
  }

  const sessionId = await createSession(user.id);

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? undefined,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
