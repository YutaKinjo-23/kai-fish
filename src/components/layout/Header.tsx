'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Menu, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  avatarUrl?: string | null;
}

export function Header({ title, onMenuClick, avatarUrl }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      console.error('ログアウトに失敗しました');
    }
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="メニューを開く"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center focus:outline-none"
          aria-label="ユーザーメニュー"
        >
          {avatarUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-brand-primary transition-all">
              <Image
                src={avatarUrl}
                alt="ユーザーアイコン"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white hover:bg-brand-primary/90 transition-colors">
              <User size={20} />
            </div>
          )}
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
