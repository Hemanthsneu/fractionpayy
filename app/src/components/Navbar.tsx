"use client";

import Link from "next/link";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl">◢</span>
          <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            FractionPay
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-white/70">
          <Link href="/marketplace" className="transition hover:text-white">
            Invest
          </Link>
          <Link href="/property" className="transition hover:text-white">
            Property
          </Link>
          <Link href="/agents" className="transition hover:text-white">
            Agents
          </Link>
          <Link href="/merchants" className="transition hover:text-white">
            Merchants
          </Link>
          <DynamicWidget variant="modal" />
        </div>
      </div>
    </nav>
  );
}
