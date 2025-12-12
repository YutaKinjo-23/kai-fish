import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const GA_ID = 'G-W21ZZ90D2F';

const notoSans = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KAI-海',
  description: 'KAI-海 管理画面',
  icons: {
    icon: '/kai-wave.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className={notoSans.className}>{children}</body>
    </html>
  );
}
