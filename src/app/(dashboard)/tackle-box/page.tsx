import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TackleBoxPage() {
  return (
    <AppLayout pageTitle="タックルボックス">
      <Card>
        <CardHeader>
          <h2>マイタックル</h2>
          <Button size="sm">新規追加</Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">タックル一覧がここに表示されます。</p>
          <div className="mt-4 border-t pt-4">
            <p className="small">まだタックルが登録されていません。</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
