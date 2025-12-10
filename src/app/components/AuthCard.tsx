import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[420px] rounded-[12px] border border-slate-100 bg-white p-8 shadow-md">
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-[#222]">{title}</h1>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
