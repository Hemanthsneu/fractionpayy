import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FractionPay — your portfolio is your payment method",
  description:
    "Tap to pay with fractions of tokenized real-world assets. NFC + ENS + an open agent economy.",
};

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-slate-950 font-sans text-white antialiased`}
      >
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(16,185,129,0.12),transparent),radial-gradient(40%_30%_at_80%_20%,rgba(34,211,238,0.08),transparent)]" />
        <Providers>
          <Navbar />
          <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
