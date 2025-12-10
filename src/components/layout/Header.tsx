import { User, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6">
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
