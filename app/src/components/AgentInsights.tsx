"use client";

import { useState } from "react";
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { BarChart3, Loader2, ChevronDown, Wallet } from "lucide-react";

interface Stats {
  totalAgents: number;
  weeks: { week: string; count: number }[];
  jobId: string;
  gbProcessed: number;
  cacheHit: boolean;
  ranAt: string;
  sql: string;
}

export function AgentInsights() {
  const [data, setData] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [error, setError] = useState("");
  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();

  async function run() {
    if (!isLoggedIn) return setShowAuthFlow(true);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/agents/stats", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "query failed");
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const max = data ? Math.max(...data.weeks.map((w) => w.count), 1) : 1;

  return (
    <div className="mb-8 rounded-2xl border border-indigo-400/20 bg-indigo-400/5 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <BarChart3 className="text-indigo-300" size={20} />
        <div>
          <p className="font-semibold">Agent economy growth — Google BigQuery</p>
          <p className="text-xs text-white/50">
            ERC-8004 registrations per week from the mainnet Identity Registry (a second real query).
          </p>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-400 to-violet-400 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : isLoggedIn ? <BarChart3 size={15} /> : <Wallet size={15} />}
          {busy ? "Querying mainnet…" : isLoggedIn ? "Run registrations query" : "Connect wallet to run"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {data && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Stat label="Total agents (2026)" value={data.totalAgents.toLocaleString()} />
            <Stat label="Weeks tracked" value={String(data.weeks.length)} />
            <Stat label="Data scanned" value={data.cacheHit ? `cached · ~${data.gbProcessed} GB` : `${data.gbProcessed} GB`} />
            <Stat label="BigQuery job" value={data.jobId.slice(0, 12) + "…"} />
          </div>

          <div className="mt-4 flex h-32 items-end gap-1 rounded-xl bg-black/30 p-3">
            {data.weeks.map((w) => (
              <div key={w.week} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${w.week}: ${w.count} registrations`}>
                <span className="mb-0.5 text-[9px] text-white/40 opacity-0 transition group-hover:opacity-100">{w.count}</span>
                <div className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-violet-400" style={{ height: `${Math.max((w.count / max) * 100, 2)}%` }} />
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-[10px] text-white/30">registrations per week · {data.weeks[0]?.week} → {data.weeks.at(-1)?.week}</p>

          <button onClick={() => setShowSql((s) => !s)} className="mt-3 flex items-center gap-1 text-xs text-indigo-300 hover:underline">
            <ChevronDown size={13} className={showSql ? "rotate-180 transition" : "transition"} />
            {showSql ? "Hide" : "Show"} the SQL
          </button>
          {showSql && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-[10px] leading-relaxed text-white/70">{data.sql}</pre>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <p className="text-white/40">{label}</p>
      <p className="mt-0.5 truncate font-mono text-white/90">{value}</p>
    </div>
  );
}
