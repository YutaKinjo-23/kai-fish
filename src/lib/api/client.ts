import { isPlanForbiddenError, PLAN_FORBIDDEN_CODE } from '@/lib/features/errors';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (typeof v !== 'object' || v === null) return null;
  return v as Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown
  ) {
    super(`API Error: ${status}`);
    this.name = 'ApiError';
  }
}

export class PlanForbiddenError extends ApiError {
  public featureKey?: string;

  constructor(data: unknown) {
    super(403, data);
    this.name = 'PlanForbiddenError';

    if (isPlanForbiddenError(data)) {
      this.featureKey = data.featureKey;
      return;
    }

    const obj = asRecord(data);
    if (!obj) return;
    if (obj.code !== PLAN_FORBIDDEN_CODE) return;

    // 既存のApiError型などの場合
    // featureKey または feature プロパティを探す
    if (typeof obj.featureKey === 'string') {
      this.featureKey = obj.featureKey;
    } else if (typeof obj.feature === 'string') {
      this.featureKey = obj.feature;
    }
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = { message: res.statusText };
    }

    if (res.status === 403) {
      // 1. レスポンスボディ自体が PLAN_FORBIDDEN か
      if (isPlanForbiddenError(body)) {
        throw new PlanForbiddenError(body);
      }

      // 2. { error: ... } の形をしていて、中身が PLAN_FORBIDDEN か
      const errorObj = asRecord(body)?.error;
      if (isPlanForbiddenError(errorObj)) {
        throw new PlanForbiddenError(errorObj);
      }
    }

    throw new ApiError(res.status, body);
  }

  return res.json();
}
