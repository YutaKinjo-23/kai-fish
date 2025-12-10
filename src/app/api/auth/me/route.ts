import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, deleteSession, getUserBySession } from '../_lib/store';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    const response = NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });

    // TODO: 本番環境をHTTPS化したら secure: true に変更すること
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    deleteSession(sessionId);
    return response;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      areas: user.areas ?? undefined,
      targets: user.targets ?? undefined,
    },
  });
}
