'use client';

import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#f7f9fb] px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">利用規約</h1>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            本利用規約（以下「本規約」といいます。）は、KAI-海（以下「本サービス」といいます。）が提供する
            釣行記録および関連機能の利用条件を定めるものです。
            本サービスを利用するユーザー（以下「ユーザー」といいます。）は、本規約に同意したものとみなします。
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第1条（適用）</h2>
            <p>
              本規約は、ユーザーと本サービス運営者との間の、本サービスの利用に関わる一切の関係に適用されます。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第2条（サービス内容）</h2>
            <p>
              本サービスは、釣行記録、タックル管理、データ可視化等の機能を提供します。
              提供内容は、ユーザーへの事前通知なく変更・停止される場合があります。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第3条（禁止事項）</h2>
            <p>ユーザーは、以下の行為を行ってはなりません。</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>不正アクセス、またはこれを試みる行為</li>
              <li>他のユーザーまたは第三者に不利益・損害を与える行為</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              第4条（サービスの停止・中断）
            </h2>
            <p>
              本サービスは、以下の場合に事前の通知なく、全部または一部の提供を停止・中断できるものとします。
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>システム保守、障害対応の場合</li>
              <li>天災地変、その他やむを得ない事由がある場合</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第5条（免責事項）</h2>
            <p>
              本サービスは、提供する情報の正確性・完全性を保証するものではありません。
              本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第6条（規約の変更）</h2>
            <p>
              運営者は、必要と判断した場合には、ユーザーへの通知なく本規約を変更することができます。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第7条（準拠法）</h2>
            <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-medium text-[#0077FF] hover:text-[#0066DD] hover:underline"
          >
            ← 戻る
          </button>
        </div>
      </div>
    </div>
  );
}
