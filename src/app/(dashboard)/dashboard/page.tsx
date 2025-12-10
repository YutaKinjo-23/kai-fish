import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  return (
    <AppLayout pageTitle="ダッシュボード">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h2>最近の釣行</h2>
            <Button size="sm">新規追加</Button>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">最近の釣行記録がここに表示されます。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2>統計</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>釣行回数</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span>総釣果数</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2>天気</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">天気情報がここに表示されます。</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
