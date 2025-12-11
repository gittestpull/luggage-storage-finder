import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
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
  title: "내 주변 짐보관소 찾기 - 가장 가까운 물품보관소 검색",
  description: "가장 가까운 짐보관소를 쉽고 빠르게 찾아보세요. 여행자와 도시 방문객을 위한 필수 짐보관소 찾기 서비스입니다.",
  keywords: "짐보관소, 짐보관, 물품보관, 여행, 서울, 지하철, 코인락커, luggage storage",
  openGraph: {
    title: "내 주변 짐보관소 찾기",
    description: "가장 가까운 짐보관소를 쉽고 빠르게 찾아보세요.",
    type: "website",
    locale: "ko_KR",
  },
  other: {
    "google-adsense-account": "ca-pub-2858917314962782",
  },

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
      {/* Google Tag Manager */}
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;
          f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-M8RWVFJ2');`}
      </Script>

      {/* Google Analytics gtag.js */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-2N6DWK6Y32" strategy="afterInteractive" />
      <Script id="gtag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-2N6DWK6Y32');`}
      </Script>

      {/* Google AdSense */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2858917314962782"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <body className={`${notoSansKR.variable} font-sans antialiased bg-gray-100`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M8RWVFJ2"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

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
