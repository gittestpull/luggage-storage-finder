import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import GlobalModals from "@/components/modals/GlobalModals";
import FloatingButtons from "@/components/layout/FloatingButtons";
import PWAManager from "@/components/PWAManager";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://my-luggage-app.duckdns.org'),
  alternates: {
    canonical: './',
  },
  title: {
    template: '%s | 짐보관소 찾기',
    default: '짐보관소 찾기 - 여행의 시작과 끝을 가볍게',
  },
  description: '서울, 부산, 제주 등 전국 물품보관함과 짐 보관소를 쉽고 빠르게 찾아보세요.',
  applicationName: '짐보관소 찾기',
  openGraph: {
    title: '짐보관소 찾기',
    description: '여행 짐 보관, 물품보관함 위치 찾기 필수 앱',
    siteName: '짐보관소 찾기',
    locale: 'ko_KR',
    type: 'website',
  },
  icons: {
    icon: '/icon.png',
  },
  other: {
    "google-adsense-account": "ca-pub-2858917314962782",
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '짐보관소 찾기',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://my-luggage-app.duckdns.org',
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <Script
          id="consent-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'functionality_storage': 'denied',
                'personalization_storage': 'denied',
                'security_storage': 'granted',
                'wait_for_update': 500
              });
            `,
          }}
        />
        <Script
          id="cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="a7f1f38c-83f6-4d68-a07f-2e2d4992c5f6"
          data-blockingmode="auto"
          strategy="beforeInteractive"
        />
      </head>
      <GoogleAnalytics gaId="G-2N6DWK6Y32" />


      {/* Google AdSense */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2858917314962782"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <body className={`${notoSansKR.variable} font-sans antialiased bg-gray-100`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <PWAManager />
          <Header />
          <div className="pt-16">
            {children}
          </div>
          <Footer />
          <GlobalModals />
          <FloatingButtons />
        </AuthProvider>

        {/* Kakao SDK */}
        <Script src="//developers.kakao.com/sdk/js/kakao.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
