import type { FeatureKey, Plan } from '@/lib/plan/features';
import type { MeResponse } from './types';

function isPlan(value: unknown): value is Plan {
  return value === 'free' || value === 'pro';
}

function isFeatureKey(value: unknown): value is FeatureKey {
  return value === 'dashboard.advanced' || value === 'lure.breakdown' || value === 'ai.recommend';
}

export async function getMe(): Promise<MeResponse> {
  const res = await fetch('/api/me', { method: 'GET' });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('認証が必要です。');
    }
    throw new Error('ユーザー情報の取得に失敗しました。');
  }

  const json: unknown = await res.json();

  if (typeof json !== 'object' || json === null) {
    throw new Error('ユーザー情報の形式が不正です。');
  }

  const record = json as Record<string, unknown>;
  const id = record.id;
  const plan = record.plan;
  const features = record.features;

  if (typeof id !== 'string') {
    throw new Error('ユーザー情報の形式が不正です。');
  }

  if (!isPlan(plan)) {
    throw new Error('ユーザー情報の形式が不正です。');
  }

  if (!Array.isArray(features) || !features.every(isFeatureKey)) {
    throw new Error('ユーザー情報の形式が不正です。');
  }

  return { id, plan, features };
}
