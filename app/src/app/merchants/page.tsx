"use client";

import { QRCodeSVG } from "qrcode.react";
import { Nfc } from "lucide-react";
import { demoMerchants } from "@/lib/merchants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fractionpayy.vercel.app";

export default function MerchantsPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-[var(--citrus)]/80">Merchant tools</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">NFC + QR payment cards</h1>
        <p className="mt-2 max-w-2xl text-[var(--fg)]/50">
          A merchant&apos;s entire onboarding: an ENS name. Program the URL below onto an NFC
          card (NDEF URI record) or print the QR. Customers tap or scan — no app install.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        {demoMerchants.map((m) => {
          const url = `${APP_URL}/pay/${m.ensName}`;
          return (
            <div
              key={m.ensName}
              className="rounded-2xl border border-[var(--fg)]/10 bg-[var(--fg)] p-5 text-center text-black"
            >
              <p className="text-3xl">{m.emoji}</p>
              <p className="mt-1 font-bold">{m.displayName}</p>
              <p className="mb-4 font-mono text-xs text-black/50">{m.ensName}</p>
              <div className="mx-auto w-fit rounded-xl bg-[var(--fg)] p-2">
                <QRCodeSVG value={url} size={160} level="M" />
              </div>
              <p className="mt-3 break-all font-mono text-[10px] text-black/40">{url}</p>
              <div className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-black/5 py-2 text-xs font-medium">
                <Nfc size={14} /> write this URL to the NFC card
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
