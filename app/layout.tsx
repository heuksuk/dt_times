import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const gowunBatang = localFont({
  src: [
    { path: "./fonts/GowunBatang-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GowunBatang-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-festival",
  display: "swap",
});

export const metadata: Metadata = {
  title: "동물팀 찾기",
  description: "행사용 동물팀 설문과 팀 배정",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body className={gowunBatang.variable}>{children}</body>
    </html>
  );
}
