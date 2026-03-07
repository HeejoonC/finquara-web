import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finquara — 글로벌 금융·계리 인재 네트워크",
  description: "금융·계리 분야 전문 채용 플랫폼. 계리사 채용공고를 찾고 등록하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased bg-gray-50`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
