import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getUserBySession, updateUserSettings } from '../_lib/store';

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });
  }

  let body: {
    displayName?: string;
    avatarUrl?: string | null;
    areas?: string[];
    targets?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '無効なリクエストです。' }, { status: 400 });
  }

  const { displayName, avatarUrl, areas, targets } = body;

  // バリデーション
  if (displayName !== undefined && typeof displayName !== 'string') {
    return NextResponse.json({ error: '表示名は文字列である必要があります。' }, { status: 400 });
  }
  if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
    return NextResponse.json({ error: 'アバターは文字列である必要があります。' }, { status: 400 });
  }
  if (areas !== undefined && !Array.isArray(areas)) {
    return NextResponse.json(
      { error: 'よく行くエリアは配列である必要があります。' },
      { status: 400 }
    );
  }
  if (targets !== undefined && !Array.isArray(targets)) {
    return NextResponse.json(
      { error: 'ターゲット魚種は配列である必要があります。' },
      { status: 400 }
    );
  }

  const updatedUser = await updateUserSettings(user.id, {
    displayName,
    avatarUrl,
    areas,
    targets,
  });

  return NextResponse.json({
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName ?? undefined,
      avatarUrl: updatedUser.avatarUrl ?? undefined,
      areas: updatedUser.areas ?? undefined,
      targets: updatedUser.targets ?? undefined,
    },
  });
}
