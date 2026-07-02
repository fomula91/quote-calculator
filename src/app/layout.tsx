import type { Metadata } from "next";
import { IBM_Plex_Sans_KR, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const plexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-plex-kr",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "견적계산기",
  description: "항목 선택형 실시간 견적 계산 · 견적서 관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${plexSansKr.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="app-header print:hidden sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-8 px-6">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-bold tracking-widest text-accent">
                Q/CALC
              </span>
              <span className="text-xs text-ink-faint">견적계산기</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="nav-link">
                새 견적
              </Link>
              <Link href="/quotations" className="nav-link">
                견적서 목록
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
