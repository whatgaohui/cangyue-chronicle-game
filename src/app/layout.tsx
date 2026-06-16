import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "苍月纪元 - Cang Yue Chronicle",
  description: "苍月纪元 - 传奇世界网页游戏",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased bg-black text-white overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
