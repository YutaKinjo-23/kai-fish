# Billing - 課金機能の実装置き場

このディレクトリは将来のStripe等決済連携に備えた置き場です。

## 現在の状態（フェーズ2）

- **決済は未実装**
- ユーザーのプランは管理者が手動で切り替え可能
- プラン変更履歴は `PlanHistory` テーブルに記録

## データ構造

### User.subscriptionId
- Stripe等のサブスクリプションIDを保存するカラム
- 現在は未使用（null）
- フェーズ3でStripe連携時に使用予定

### PlanHistory テーブル
- プラン変更の監査ログとして保持
- カラム:
  - `id`: CUID
  - `userId`: 対象ユーザー
  - `fromPlan`: 変更前プラン（free/pro）
  - `toPlan`: 変更後プラン（free/pro）
  - `reason`: 変更理由（手動切替時のメモ）
  - `changedByUserId`: 変更を実行した管理者のID
  - `createdAt`: 変更日時

## フェーズ3（決済導入時）の実装計画

1. Stripe SDKのインストール
   ```bash
   pnpm add stripe @stripe/stripe-js
   ```

2. Webhook エンドポイントの追加
   - `POST /api/billing/webhook`
   - Stripeからのイベント（subscription.created, subscription.updated, subscription.deleted等）を受信
   - イベントに応じてUser.planを更新
   - PlanHistoryに記録（changedByUserId: null, reason: "Stripe webhook"等）

3. Checkout Session 作成API
   - `POST /api/billing/checkout`
   - Stripe Checkoutセッションを作成し、決済ページURLを返す

4. Customer Portal API
   - `POST /api/billing/portal`
   - 既存の購読者がプラン変更・解約できるポータルURLを返す

5. subscriptionId の活用
   - Webhook受信時にUser.subscriptionIdを更新
   - Customer Portalアクセス時にsubscriptionIdを使用

## 環境変数（フェーズ3で追加予定）

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 注意事項

- 現フェーズでは外部サービス連携は追加しない
- プラン変更は `/api/admin/users/[id]/plan` 経由で手動のみ
- Feature Keyガードは既存の仕組みを維持
