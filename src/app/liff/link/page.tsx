'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';

type LinkStatus =
  | 'loading'
  | 'not-logged-in'
  | 'liff-error'
  | 'linking'
  | 'success'
  | 'error'
  | 'already-linked';

export default function LiffLinkPage() {
  const [status, setStatus] = useState<LinkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lineDisplayName, setLineDisplayName] = useState<string>('');

  useEffect(() => {
    const initAndLink = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      if (!liffId) {
        setStatus('liff-error');
        setErrorMessage('LIFF IDが設定されていません');
        return;
      }

      try {
        // LIFF初期化
        await liff.init({ liffId });

        // LINEログインしていなければログインページへ
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // LINEプロフィール取得（表示用）
        const profile = await liff.getProfile();
        setLineDisplayName(profile.displayName);

        // IDトークン取得（サーバーでの検証用）
        const idToken = liff.getIDToken();
        if (!idToken) {
          setStatus('liff-error');
          setErrorMessage('IDトークンを取得できませんでした。再度お試しください。');
          return;
        }

        // KAIにログインしているかチェック
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          setStatus('not-logged-in');
          return;
        }

        // LINE連携API呼び出し（IDトークンを送信、サーバーで検証）
        setStatus('linking');
        const linkRes = await fetch('/api/line/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (linkRes.ok) {
          setStatus('success');
        } else if (linkRes.status === 409) {
          setStatus('already-linked');
          setErrorMessage('このLINEアカウントは既に別のユーザーに連携されています');
        } else {
          const data = await linkRes.json().catch(() => ({}));
          setStatus('error');
          setErrorMessage(data.error || '連携に失敗しました');
        }
      } catch (err) {
        console.error('LIFF error:', err);
        setStatus('liff-error');
        setErrorMessage(err instanceof Error ? err.message : 'LIFFの初期化に失敗しました');
      }
    };

    initAndLink();
  }, []);

  const handleClose = () => {
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {/* ローディング */}
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800">LINE連携中...</h1>
            <p className="text-gray-600 mt-2">しばらくお待ちください</p>
          </>
        )}

        {/* LINEにログインしていない（リダイレクト中） */}
        {status === 'not-logged-in' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800">KAIにログインしてください</h1>
            <p className="text-gray-600 mt-2">
              LINE連携するには、先にKAI-海にログインしている必要があります。
            </p>
            <a
              href="/login"
              className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              ログインページへ
            </a>
          </>
        )}

        {/* LIFF初期化エラー */}
        {status === 'liff-error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-red-600">エラーが発生しました</h1>
            <p className="text-gray-600 mt-2">{errorMessage}</p>
            <button
              onClick={handleClose}
              className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition"
            >
              閉じる
            </button>
          </>
        )}

        {/* 連携処理中 */}
        {status === 'linking' && (
          <>
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800">連携処理中...</h1>
            {lineDisplayName && (
              <p className="text-gray-600 mt-2">
                <span className="font-medium">{lineDisplayName}</span> さんとして連携します
              </p>
            )}
          </>
        )}

        {/* 連携成功 */}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-green-600">LINE連携が完了しました！</h1>
            {lineDisplayName && (
              <p className="text-gray-600 mt-2">
                <span className="font-medium">{lineDisplayName}</span> さんとして連携されました
              </p>
            )}
            <p className="text-gray-500 mt-4 text-sm">
              これでLINEから釣行記録ができるようになりました。
            </p>
            <button
              onClick={handleClose}
              className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              閉じる
            </button>
          </>
        )}

        {/* 既に別ユーザーに連携済み */}
        {status === 'already-linked' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-yellow-600">連携できません</h1>
            <p className="text-gray-600 mt-2">{errorMessage}</p>
            <p className="text-gray-500 mt-4 text-sm">
              別のKAIアカウントで既に連携されています。
              <br />
              解除してから再度お試しください。
            </p>
            <button
              onClick={handleClose}
              className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition"
            >
              閉じる
            </button>
          </>
        )}

        {/* その他のエラー */}
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-red-600">連携に失敗しました</h1>
            <p className="text-gray-600 mt-2">{errorMessage}</p>
            <button
              onClick={handleClose}
              className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  );
}
