'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function AppLayout({ children, pageTitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAvatarUrl(data.user.avatarUrl ?? null);
        }
      } catch {
        // ユーザー情報取得失敗時は何もしない（デフォルトアイコン表示）
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex w-full min-h-screen bg-brand-bg">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 lg:ml-60 overflow-y-auto">
        <Header title={pageTitle} onMenuClick={() => setSidebarOpen(true)} avatarUrl={avatarUrl} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
