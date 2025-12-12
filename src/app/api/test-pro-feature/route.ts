import { forbiddenFeature } from '@/lib/api/errors';

export async function GET() {
  // 常にPro機能制限エラーを返す
  return forbiddenFeature('dashboard.advanced');
}
