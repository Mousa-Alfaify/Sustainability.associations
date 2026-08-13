import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStoreProvider } from "@/lib/store/app-store";

export const metadata: Metadata = {
  title: "مُحرك الاستدامة للجمعيات",
  description:
    "منصة ذكية تحلل الوضع المالي والتشغيلي للجمعيات الأهلية وتبني لها محفظة استدامة مالية من مصادر دخل متكررة.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f5f56",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <AppStoreProvider>{children}</AppStoreProvider>
      </body>
    </html>
  );
}
