'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '../components/AuthCard';
import { Logo } from '../components/Logo';

type AuthResponse = {
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
};

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [message, setMessage] = useState('');

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-[#222] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0077FF] focus:ring-2 focus:ring-[#0077FF]/20';
  const labelClass = 'block space-y-2 text-sm font-medium text-slate-700';

  const isDisabled = useMemo(
    () => status === 'loading' || email.trim().length === 0 || password.trim().length === 0,
    [email, password, status]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setStatus('error');
      setMessage('メールアドレスの形式を確認してください。');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setMessage('パスワードは8文字以上で入力してください。');
      return;
    }

    setStatus('loading');
    setMessage('サインイン中です…');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => null)) as
        | AuthResponse
        | { error?: string }
        | null;

      if (!response.ok || !data || !('user' in data)) {
        const errorMessage =
          data && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'ログインに失敗しました。';
        setStatus('error');
        setMessage(errorMessage);
        return;
      }

      setStatus('success');
      setMessage(
        data.user.displayName
          ? `${data.user.displayName} さん、ようこそ！`
          : `${data.user.email} でサインインしました。`
      );

      router.push('/');
    } catch (error) {
      setStatus('error');
      setMessage('通信に失敗しました。時間をおいて再度お試しください。');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-4 py-12 text-[#222]">
      <div className="flex w-full flex-col items-center">
        <Logo />
        <AuthCard
          title="ログイン"
          description="メールアドレスとパスワードでサインインしてください。"
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className={labelClass}>
              <span>メールアドレス</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="example@kai.jp"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              <span>パスワード</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                placeholder="8文字以上で入力"
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full rounded-lg bg-[#0077FF] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0066DD] focus:outline-none focus:ring-2 focus:ring-[#0077FF]/30 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {status === 'loading' ? 'ログイン中…' : 'ログイン'}
            </button>

            <div className="min-h-[20px] text-sm" aria-live="polite">
              {status === 'error' ? (
                <span className="font-semibold text-red-600">{message}</span>
              ) : null}
              {status === 'success' ? (
                <span className="font-semibold text-green-600">{message}</span>
              ) : null}
              {status === 'loading' ? <span className="text-[#0077FF]">{message}</span> : null}
            </div>

            <p className="text-center text-sm text-slate-600">
              <span className="inline-flex flex-wrap items-center justify-center gap-1">
                <span>アカウントをお持ちでない方は</span>
                <Link
                  href="/signup"
                  className="font-semibold text-[#0077FF] hover:text-[#0066DD] whitespace-nowrap"
                >
                  新規登録
                </Link>
                <span>してください。</span>
              </span>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
