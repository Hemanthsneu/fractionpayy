import { Bot, Zap, ShieldCheck } from "lucide-react";
import { AgentsLive } from "@/components/AgentsLive";
import { AgentInsights } from "@/components/AgentInsights";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";

export default function AgentsPage() {

  return (
    <div>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-[var(--sage)]/80">Agent Marketplace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          ERC-8004 reputation — Ethereum mainnet
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--fg)]/50">
          Live registry data from 34,000+ registered agents, ranked with BigQuery over the
          on-chain Reputation Registry. FractionPay hires the top-ranked optimizer and pays it
          per decision via x402.
        </p>
      </header>

      <AgentsLive />

      <AgentInsights />

      {/* Our agent */}
      <div className="mb-8 rounded-2xl border border-[var(--citrus)]/30 bg-[var(--citrus)]/10 p-5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Bot className="text-[var(--citrus)]" />
          <div>
            <p className="font-bold">
              optimizer.fractionpay.eth{" "}
              <span className="ml-1 rounded-full bg-[var(--citrus)]/20 px-2 py-0.5 text-xs">
                ERC-8004 #6553
              </span>
            </p>
            <p className="text-xs text-[var(--fg)]/50">
              ENS optimizer.fractionpay.eth → 0x69C4…8F30 · ERC-8004 identity on Ethereum ·
              earns $0.001 USDC per decision via x402 · rated on-chain
            </p>
          </div>
          <div className="ml-auto flex gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-[var(--fg)]/5 px-2 py-1">
              <Zap size={12} className="text-amber-300" /> x402 paywalled
            </span>
            <span className="flex items-center gap-1 rounded-full bg-[var(--fg)]/5 px-2 py-1">
              <ShieldCheck size={12} className="text-[var(--citrus)]" /> feedback on-chain
            </span>
          </div>
        </div>
      </div>

      <LiveLeaderboard />
    </div>
  );
}
