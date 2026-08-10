import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "넴쿵 교대근무표",
  description: "멋진여자 박네모가 만든 넴쿵 교대근무표",
  applicationName: "넴쿵 교대근무표",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "넴쿵 교대근무표",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/** 첫 페인트 전 테마 적용 (깜빡임 방지) */
const themeBootScript = `(function(){try{var t=localStorage.getItem('shift-calendar-theme');var dark=t==='dark';if(t==='schedule'){var light=true;try{var s=JSON.parse(localStorage.getItem('shift-calendar-theme-schedule')||'{}');var a=String(s.lightStart||'07:00').split(':');var b=String(s.lightEnd||'19:00').split(':');var sm=(+a[0]||0)*60+(+a[1]||0);var em=(+b[0]||0)*60+(+b[1]||0);var n=new Date();var nm=n.getHours()*60+n.getMinutes();if(sm===em)light=true;else if(sm<em)light=nm>=sm&&nm<em;else light=nm>=sm||nm<em;}catch(e){}dark=!light;}if(dark){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="넴쿵 교대근무표" />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
