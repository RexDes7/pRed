import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/dashboard/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ТренерБот — панель управления",
  description:
    "Админ-панель Telegram-бота для автоматизации продаж курсов, услуг и тренировочных программ тренера по фитнесу.",
  keywords: [
    "Telegram бот",
    "фитнес",
    "тренер",
    "курсы",
    "онлайн-тренировки",
    "продажи",
  ],
  authors: [{ name: "ТренерБот" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ТренерБот — панель управления",
    description:
      "Управляйте каталогом, заказами и Telegram-ботом тренера из одного места.",
    siteName: "ТренерБот",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
