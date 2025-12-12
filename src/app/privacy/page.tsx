'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#f7f9fb] px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">プライバシーポリシー</h1>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            KAI-海（以下「本サービス」といいます。）は、ユーザーの個人情報の取扱いについて、
            以下のとおりプライバシーポリシーを定めます。
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第1条（取得する情報）</h2>
            <p>本サービスは、以下の情報を取得する場合があります。</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>アカウント登録時の情報（メールアドレス等）</li>
              <li>釣行記録、入力データ</li>
              <li>アクセスログ、Cookie等の技術情報</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第2条（利用目的）</h2>
            <p>取得した情報は、以下の目的で利用します。</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>本サービスの提供・運営</li>
              <li>利用状況の分析およびサービス改善</li>
              <li>不正利用の防止</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第3条（第三者提供）</h2>
            <p>
              法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第4条（安全管理）</h2>
            <p>
              本サービスは、個人情報の漏洩・滅失・改ざんを防止するため、合理的な安全対策を講じます。
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              第5条（個人情報の開示・訂正）
            </h2>
            <p>ユーザーは、自身の個人情報について、開示・訂正・削除を求めることができます。</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第6条（ポリシーの変更）</h2>
            <p>本ポリシーは、必要に応じて変更されることがあります。</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">第7条（お問い合わせ）</h2>
            <p>本ポリシーに関するお問い合わせは、以下までご連絡ください。</p>
            <p className="mt-2">運営者：KAI-海</p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScW4-2EIhLG-49tpskWLqgxIJGQQ3L2MB3EcfsfZdGe_6m1rw/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[#0077FF] hover:text-[#0066DD] hover:underline"
            >
              お問い合わせフォームはこちら
            </a>
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
