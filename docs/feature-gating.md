# Feature Gating (Plan Guard) 運用ガイド

本プロジェクトでは、プラン（Free/Pro）に応じた機能制限（Feature Gating）を以下のルールで運用します。

## 1. 基本方針

- **Feature Key方式**: プラン名（`pro`など）を直接コードに書かず、機能ごとのキー（`lures.breakdown`など）で判定します。
- **BEガード**: Route Handlerの入口で必ず権限チェックを行い、未許可なら `403 Forbidden` を返します。
- **FEガード**: 画面を非表示にするのではなく、ユーザーがアクションを起こした際に `403` を検知してPro誘導モーダルを表示します。

## 2. 新機能追加時の手順

新しくPro限定機能を追加する場合の手順です。

### Step 1: Feature Keyの定義

`src/lib/features/features.ts` に新しいキーを追加し、プランへの割り当てを行います。

```typescript
// src/lib/features/features.ts

export type FeatureKey = 
  | 'dashboard.advanced'
  | 'lures.breakdown'
  | 'ai.recommend'
  | 'new.feature'; // <--- 追加

export const PLAN_FEATURES = {
  free: [],
  pro: [
    'dashboard.advanced',
    'lures.breakdown',
    'ai.recommend',
    'new.feature', // <--- Proに追加
  ],
} as const;
```

### Step 2: Backend (Route Handler) でのガード

APIルートの先頭で `requireFeature` を呼び出します。
未許可の場合、自動的に `403 Forbidden` (JSON) が返されます。

```typescript
// src/app/api/new-feature/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireFeature } from '@/lib/features/requireFeature';

export async function GET(req: NextRequest) {
  try {
    // 1. 権限チェック (未許可ならここでthrowされ、catchブロックへ)
    const { user } = await requireFeature('new.feature');

    // 2. メイン処理
    return NextResponse.json({ data: 'Secret Data' });

  } catch (e) {
    // 3. エラーハンドリング定型
    // requireFeatureが投げたResponseをそのまま返す
    if (e instanceof Response) {
      return e;
    }
    console.error(e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### Step 3: Frontend でのガードと誘導

API呼び出しを行い、`403` エラーが返ってきた場合にPro誘導モーダルを表示します。
`usePlanGuard` フックを使用します。

```typescript
// src/components/NewFeatureButton.tsx
'use client';

import { usePlanGuard } from '@/hooks/usePlanGuard';
import { fetchJson, PlanForbiddenError } from '@/lib/api/client';

export function NewFeatureButton() {
  const { handlePlanForbidden } = usePlanGuard();

  const handleClick = async () => {
    try {
      await fetchJson('/api/new-feature');
      // 成功時の処理
    } catch (e) {
      // 403エラーを検知してモーダルを表示
      // featureKeyが特定できる場合は自動的に適切な文言が出ます
      if (handlePlanForbidden(e)) {
        return;
      }
      // その他のエラー処理
      console.error(e);
    }
  };

  return <button onClick={handleClick}>機能を使う</button>;
}
```

## 3. テスト観点

機能追加時には以下の観点で動作確認を行ってください。

### Unit Test / Integration Test 観点

1.  **Freeプランユーザーの場合**:
    *   `hasFeature('free', 'new.feature')` が `false` であること。
    *   APIにアクセスした際、ステータスコード `403` が返ること。
    *   レスポンスボディが `{ error: { code: 'PLAN_FORBIDDEN', featureKey: 'new.feature' } }` の形式であること。

2.  **Proプランユーザーの場合**:
    *   `hasFeature('pro', 'new.feature')` が `true` であること。
    *   APIにアクセスした際、正常なレスポンス（`200`など）が返ること。

### E2E / 手動テスト観点

1.  **Freeユーザーでの操作**:
    *   該当機能のボタンを押下（またはページアクセス）した際、Pro誘導モーダルが表示されること。
    *   モーダル内の文言や画像が適切であること（必要に応じて `PlanGateModalContext` 側で調整）。

2.  **Proユーザーでの操作**:
    *   モーダルが表示されず、機能が正常に実行されること。
