import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getUserBySession } from '@/app/api/auth/_lib/store';
import { cookies } from 'next/headers';

// エリアに紐づくスポット一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');

    if (!area) {
      return NextResponse.json({ error: 'area is required' }, { status: 400 });
    }

    const spots = await prisma.spot.findMany({
      where: { area },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        area: true,
      },
    });

    return NextResponse.json({ spots });
  } catch (error) {
    console.error('スポット取得エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 新しいスポットを登録
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserBySession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, area } = body;

    if (!name || !area) {
      return NextResponse.json({ error: 'name and area are required' }, { status: 400 });
    }

    // 既存チェック（同じエリア・スポット名があれば返す）
    const existing = await prisma.spot.findUnique({
      where: {
        name_area: { name, area },
      },
    });

    if (existing) {
      return NextResponse.json({ spot: existing });
    }

    // 新規作成
    const spot = await prisma.spot.create({
      data: {
        name,
        area,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ spot }, { status: 201 });
  } catch (error) {
    console.error('スポット作成エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
