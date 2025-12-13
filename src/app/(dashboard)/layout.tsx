import { AppLayout } from '@/components/layout/AppLayout';
import { MeProvider } from '@/features/me/MeProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <MeProvider>{children}</MeProvider>;
}
