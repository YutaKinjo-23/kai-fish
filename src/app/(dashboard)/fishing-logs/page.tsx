import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function FishingLogsPage() {
  return (
    <AppLayout pageTitle="釣行記録">
      <Card>
        <CardHeader>
          <h2>釣行記録</h2>
          <Button size="sm">新規追加</Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">釣行記録一覧がここに表示されます。</p>
          <div className="mt-4 border-t pt-4">
            <p className="small">まだ記録がありません。</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
