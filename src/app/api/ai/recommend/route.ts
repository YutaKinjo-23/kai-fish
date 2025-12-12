import { NextRequest, NextResponse } from 'next/server';
import { requireFeature } from '@/lib/api/guards';

type RecommendRequestBody = {
  prompt: string;
};

function isRecommendRequestBody(value: unknown): value is RecommendRequestBody {
  if (typeof value !== 'object' || value === null) return false;
  if (!('prompt' in value)) return false;

  const prompt = (value as { prompt?: unknown }).prompt;
  return typeof prompt === 'string';
}

/**
 * POST /api/ai/recommend
 * Pro限定のダミー推薦API（縦切り実装用）
 *
 * curl例:
 * - Free: 403 (PLAN_FORBIDDEN)
 *   curl -i -X POST http://localhost:3000/api/ai/recommend -H "Content-Type: application/json" -d "{\"prompt\":\"hello\"}"
 * - Pro: 200
 *   curl -i -X POST http://localhost:3000/api/ai/recommend -H "Content-Type: application/json" -d "{\"prompt\":\"hello\"}"
 */
export async function POST(request: NextRequest) {
  try {
    await requireFeature('ai.recommend');

    const body: unknown = await request.json();
    if (!isRecommendRequestBody(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    return NextResponse.json({
      isDummy: true,
      featureKey: 'ai.recommend',
      receivedPrompt: body.prompt,
      items: [
        { id: 'dummy-1', title: 'DUMMY RECOMMEND 1', score: 0.9, reason: 'DUMMY_REASON' },
        { id: 'dummy-2', title: 'DUMMY RECOMMEND 2', score: 0.6, reason: 'DUMMY_REASON' },
        { id: 'dummy-3', title: 'DUMMY RECOMMEND 3', score: 0.3, reason: 'DUMMY_REASON' },
      ],
    });
  } catch (e: unknown) {
    if (e instanceof Response) {
      return e;
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
