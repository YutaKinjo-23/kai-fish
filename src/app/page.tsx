export default function Home() {
  return (
    <main style={{ padding: '48px' }}>
      <h1 style={{ margin: 0 }}>fish-kai Console</h1>
      <p style={{ marginTop: '12px', maxWidth: '520px' }}>
        ログインと管理画面の土台です。LINE Bot は後から統合できます。
      </p>
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          borderRadius: '12px',
          background: 'white',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <p style={{ margin: 0 }}>
          ここに認証・ダッシュボード・設定ページを順次追加していきましょう。
        </p>
      </div>
    </main>
  );
}
