import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DentAI — AI Рецепционист за Дентални Клиники",
  description:
    "DentAI е първият AI рецепционист за дентални клиники в България. Отговаря на обаждания 24/7, записва часове и увеличава приходите ви.",
  keywords: "AI рецепционист, дентална клиника, България, автоматизация",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body
        className={`${outfit.variable} ${plusJakartaSans.variable} antialiased bg-dark-900 text-[#e2e8f0] font-body`}
      >
        {children}
      </body>
    </html>
  );
}
