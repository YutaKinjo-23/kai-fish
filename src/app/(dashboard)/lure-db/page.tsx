import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function LureDBPage() {
  return (
    <AppLayout pageTitle="ルアー図鑑">
      <Card>
        <CardHeader>
          <h2>ルアー図鑑</h2>
          <Button size="sm">新規追加</Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">ルアー一覧がここに表示されます。</p>
          <div className="mt-4 border-t pt-4">
            <p className="small">まだルアーが登録されていません。</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
