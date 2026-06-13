import { Bot, Zap, ShieldCheck } from "lucide-react";
import leaderboard from "@/data/leaderboard.json";
import { AgentsLive } from "@/components/AgentsLive";

export default function AgentsPage() {
  const { generatedAt, agents } = leaderboard;

  return (
    <div>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-cyan-300/80">Agent Marketplace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          ERC-8004 reputation — Ethereum mainnet
        </h1>
        <p className="mt-2 max-w-2xl text-white/50">
          Live registry data from 34,000+ registered agents, ranked with BigQuery over the
          on-chain Reputation Registry. FractionPay hires the top-ranked optimizer and pays it
          per decision via x402.
        </p>
      </header>

      <AgentsLive />

      {/* Our agent */}
      <div className="mb-8 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Bot className="text-emerald-300" />
          <div>
            <p className="font-bold">
              optimizer.fractionpay.eth{" "}
              <span className="ml-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs">
                agent #7031
              </span>
            </p>
            <p className="text-xs text-white/50">
              ERC-8004 Identity Registry · Base Sepolia · treasury is a Privy server wallet
              (0xb61A…E0E6) · earns $0.001 USDC per decision via x402
            </p>
          </div>
          <div className="ml-auto flex gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
              <Zap size={12} className="text-amber-300" /> x402 paywalled
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
              <ShieldCheck size={12} className="text-emerald-300" /> feedback on-chain
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3 text-right">Feedback</th>
              <th className="px-4 py-3 text-right">Unique clients</th>
              <th className="px-4 py-3 text-right">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {agents.slice(0, 20).map((a, i) => {
              const suspicious = a.uniqueClients / a.feedbackCount < 0.4;
              return (
                <tr key={a.agentId} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/40">{i + 1}</td>
                  <td className="px-4 py-3 font-mono">agent #{a.agentId}</td>
                  <td className="px-4 py-3 text-right">{a.feedbackCount}</td>
                  <td className="px-4 py-3 text-right">
                    {a.uniqueClients}
                    {suspicious && (
                      <span
                        className="ml-2 rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300"
                        title="Low client diversity — possible reputation inflation. Our diversity-weighted score penalizes this."
                      >
                        low diversity
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-300">
                    {a.reputationScore.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-white/30">
        Source: bigquery-public-data.crypto_ethereum · Reputation Registry 0x8004BAa1…9b63 ·
        snapshot {new Date(generatedAt).toLocaleString()} · score = feedback × client-diversity
        (penalizes self-dealing)
      </p>
    </div>
  );
}
