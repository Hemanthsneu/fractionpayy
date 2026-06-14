import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
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
const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "FractionPay — your portfolio is your payment method",
  description:
    "Tap to pay with fractions of tokenized real-world assets. NFC + ENS + an open agent economy.",
};

export const viewport: Viewport = {
  themeColor: "#08080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} grain min-h-dvh bg-[var(--bg)] font-sans text-[var(--fg)] antialiased`}
      >
        <PreloaderWrapper>
          {/* WebGL shader field — behind everything */}
          <WebGLBackground />

          {/* Particle constellation field */}
          <ParticleField />

          {/* layered atmosphere — fixed, behind everything */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="grid-lines absolute inset-0" />
            <div className="aurora-blob absolute -top-40 left-[10%] h-[48rem] w-[48rem] rounded-full opacity-[0.22] blur-[60px]" style={{ background: 'radial-gradient(circle, var(--citrus) 0%, transparent 65%)' }} />
            <div className="aurora-blob delay absolute top-[20%] right-[5%] h-[44rem] w-[44rem] rounded-full opacity-[0.14] blur-[70px]" style={{ background: 'radial-gradient(circle, var(--sage) 0%, transparent 65%)' }} />
            <div className="aurora-blob absolute bottom-[-10%] left-[30%] h-[40rem] w-[40rem] rounded-full opacity-[0.10] blur-[60px]" style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 65%)' }} />
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
