'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Package, Sparkles, Settings, X } from 'lucide-react';

const menuItems = [
  { href: '/dashboard' as const, label: 'ダッシュボード', icon: <LayoutDashboard size={24} /> },
  { href: '/fishing-logs' as const, label: '釣行記録', icon: <BookOpen size={24} /> },
  { href: '/tackle-box' as const, label: 'タックルボックス', icon: <Package size={24} /> },
  { href: '/lure-db' as const, label: 'ルアー図鑑', icon: <Sparkles size={24} /> },
  { href: '/settings' as const, label: '設定', icon: <Settings size={24} /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* オーバーレイ（モバイル用） */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* サイドバー */}
      <aside
        className={`fixed left-0 top-0 h-screen w-60 bg-brand-primary text-white overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="KAI-海" width={40} height={40} className="h-10 w-10" />
            <span className="text-xl font-bold text-white">KAI-海</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/80 hover:text-white"
            aria-label="メニューを閉じる"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="mt-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto px-6 py-4 border-t border-white/10">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
            <Link href="/terms" onClick={onClose} className="hover:text-white hover:underline">
              利用規約
            </Link>
            <Link href="/privacy" onClick={onClose} className="hover:text-white hover:underline">
              プライバシーポリシー
            </Link>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScW4-2EIhLG-49tpskWLqgxIJGQQ3L2MB3EcfsfZdGe_6m1rw/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white hover:underline"
            >
              お問い合わせ
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
