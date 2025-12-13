'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface PlanHistory {
  id: string;
  fromPlan: string;
  toPlan: string;
  reason: string | null;
  changedByUserId: string | null;
  createdAt: string;
}

interface UserDetail {
  id: string;
  email: string;
  displayName: string | null;
  plan: string;
  subscriptionId: string | null;
  createdAt: string;
  planHistories: PlanHistory[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reason, setReason] = useState('');

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        if (res.status === 403) {
          setError('管理者権限が必要です');
        } else if (res.status === 401) {
          setError('ログインが必要です');
        } else if (res.status === 404) {
          setError('ユーザーが見つかりません');
        } else {
          setError('ユーザー情報の取得に失敗しました');
        }
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handlePlanChange = async (newPlan: 'free' | 'pro') => {
    if (!user || user.plan === newPlan) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan, reason: reason || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`エラー: ${data.error?.message || 'プラン変更に失敗しました'}`);
        return;
      }

      // 成功したら再取得
      setReason('');
      await fetchUser();
    } catch {
      alert('通信エラーが発生しました');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">ユーザー詳細</h1>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">ユーザー詳細</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-900">
            ← ユーザー一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-900">
            ← ユーザー一覧に戻る
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">ユーザー詳細</h1>

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">基本情報</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">ID</dt>
              <dd className="text-sm font-mono">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">メール</dt>
              <dd className="text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">表示名</dt>
              <dd className="text-sm">{user.displayName || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">登録日</dt>
              <dd className="text-sm">{new Date(user.createdAt).toLocaleDateString('ja-JP')}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">サブスクリプションID</dt>
              <dd className="text-sm font-mono">{user.subscriptionId || '（未設定）'}</dd>
            </div>
          </dl>
        </div>

        {/* プラン変更 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">プラン管理</h2>
          <div className="mb-4">
            <span className="text-sm text-gray-500">現在のプラン: </span>
            <span
              className={`px-2 py-1 text-sm font-semibold rounded ${
                user.plan === 'pro' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {user.plan}
            </span>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-1">変更理由（任意）</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: テスト用にPro化"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePlanChange('free')}
              disabled={updating || user.plan === 'free'}
              className={`px-4 py-2 rounded text-sm font-medium ${
                user.plan === 'free'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              Freeに変更
            </button>
            <button
              onClick={() => handlePlanChange('pro')}
              disabled={updating || user.plan === 'pro'}
              className={`px-4 py-2 rounded text-sm font-medium ${
                user.plan === 'pro'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Proに変更
            </button>
          </div>
        </div>

        {/* プラン変更履歴 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">プラン変更履歴</h2>
          {user.planHistories.length === 0 ? (
            <p className="text-sm text-gray-500">変更履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {user.planHistories.map((history) => (
                <div key={history.id} className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="text-sm">
                    <span className="font-mono bg-gray-100 px-1 rounded">{history.fromPlan}</span>
                    <span className="mx-2">→</span>
                    <span className="font-mono bg-gray-100 px-1 rounded">{history.toPlan}</span>
                  </div>
                  {history.reason && (
                    <div className="text-sm text-gray-600 mt-1">理由: {history.reason}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(history.createdAt).toLocaleString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
