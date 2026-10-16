import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s · SortSnap",
    default: "SortSnap — Snap your trash. Know the bin.",
  },
  description:
    "SortSnap uses AI to tell you which bin your trash belongs in. Snap a photo and get Cupertino recycling, compost or trash guidance in seconds.",
  applicationName: "SortSnap",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0">
        <Header />
        {/* Shared page container: every route (incl. /scan) renders inside this. */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
