import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';

/**
 * 釣行記録で使用されたスポット一覧を取得 (GET)
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未認証です。' }, { status: 401 });
  }

  const user = await getUserBySession(sessionId);
  if (!user) {
    return NextResponse.json({ error: 'セッションが無効です。' }, { status: 401 });
  }

  // 釣行記録のスポットイベントからエリアとスポット名を取得
  const spotEvents = await prisma.fishingEvent.findMany({
    where: {
      type: 'spot',
      fishingLog: { userId: user.id },
      OR: [{ area: { not: null } }, { spotName: { not: null } }],
    },
    select: {
      area: true,
      spotName: true,
    },
    distinct: ['area', 'spotName'],
  });

  const spots = spotEvents
    .filter((e) => e.area || e.spotName)
    .map((e) => ({
      area: e.area || '',
      spotName: e.spotName || '',
    }));

  return NextResponse.json({ spots });
}
