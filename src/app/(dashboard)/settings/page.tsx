import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <AppLayout pageTitle="設定">
      <Card>
        <CardHeader>
          <h2>設定</h2>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">設定項目がここに表示されます。</p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
