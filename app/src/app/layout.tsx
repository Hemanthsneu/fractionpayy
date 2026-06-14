import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollProgress } from "@/components/ScrollProgress";
import { WebGLBackground } from "@/components/WebGLBackground";
import { PreloaderWrapper } from "@/components/PreloaderWrapper";
import { ParticleField } from "@/components/ParticleField";
import { ChapterNav } from "@/components/ChapterNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
// Fancy editorial serif for big headlines (Offerly-style display contrast).
const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${serif.variable} grain min-h-dvh bg-[#05070a] font-sans text-white antialiased`}
      >
        <PreloaderWrapper>
          {/* WebGL shader field — behind everything */}
          <WebGLBackground />

          {/* Particle constellation field */}
          <ParticleField />

          {/* layered atmosphere — fixed, behind everything */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="grid-lines absolute inset-0" />
            <div className="aurora-blob absolute -top-40 left-[10%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_65%)] blur-3xl" />
            <div className="aurora-blob delay absolute top-[20%] right-[5%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_65%)] blur-3xl" />
            <div className="aurora-blob absolute bottom-[-10%] left-[30%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.09),transparent_65%)] blur-3xl" />
            <div className="absolute inset-0 bg-[#05070a]/40" />
          </div>

          <ScrollProgress />
          <SmoothScroll />
          <Providers>
            <Navbar />
            <ChapterNav />
            <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-24">{children}</main>
          </Providers>
        </PreloaderWrapper>
      </body>
    </html>
  );
}
