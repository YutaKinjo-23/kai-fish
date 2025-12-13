import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  createUser,
  validateEmail,
} from '../_lib/store';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'email と password を指定してください。' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;
  const displayName = typeof body.displayName === 'string' ? body.displayName : undefined;
  const areas =
    Array.isArray(body.areas) &&
    body.areas.every((item: unknown): item is string => typeof item === 'string')
      ? body.areas
      : undefined;
  const targets =
    Array.isArray(body.targets) &&
    body.targets.every((item: unknown): item is string => typeof item === 'string')
      ? body.targets
      : undefined;

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

  if (displayName && displayName.length > 80) {
    return NextResponse.json({ error: '表示名は80文字以内で入力してください。' }, { status: 400 });
  }

  const result = await createUser({ email, password, displayName, areas, targets });
  if ('error' in result) {
    return NextResponse.json(
      { error: 'このメールアドレスは既に登録されています。' },
      { status: 409 }
    );
  }

  const sessionId = await createSession(result.user.id);

  const response = NextResponse.json(
    {
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
      },
    },
    { status: 201 }
  );

  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
