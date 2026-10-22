import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "دستیار هوشمند خرید حضوری | ترب",
  description: "پیدا کردن ارزان‌ترین فروشگاه‌های تهران با هوش مصنوعی",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable}`}>
      <body className="font-sans antialiased bg-zinc-950">
        {children}
      </body>
    </html>
  );
}