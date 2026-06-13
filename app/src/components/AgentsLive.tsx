"use client";

import { useState } from "react";
import { Database, Loader2, ChevronDown } from "lucide-react";

interface LiveResult {
  agents: { agentId: string; feedbackCount: number; uniqueClients: number; reputationScore: number }[];
  jobId: string;
  gbProcessed: number;
  ranAt: string;
  projectId: string;
  sql: string;
}

export function AgentsLive() {
  const [data, setData] = useState<LiveResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/agents/live", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "query failed");
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <Database className="text-sky-300" size={20} />
        <div>
          <p className="font-semibold">Live reputation ranking — Google BigQuery</p>
          <p className="text-xs text-white/50">
            Runs a real query over Ethereum mainnet ERC-8004 data (appears in your Google Cloud
            console).
          </p>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
          {busy ? "Querying mainnet…" : "Run live BigQuery query"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {data && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Stat label="GCP project" value={data.projectId} />
            <Stat label="Data scanned" value={`${data.gbProcessed} GB`} />
            <Stat label="BigQuery job" value={data.jobId.slice(0, 14) + "…"} />
            <Stat label="Agents ranked" value={String(data.agents.length)} />
          </div>

          <button
            onClick={() => setShowSql((s) => !s)}
            className="mt-3 flex items-center gap-1 text-xs text-sky-300 hover:underline"
          >
            <ChevronDown size={13} className={showSql ? "rotate-180 transition" : "transition"} />
            {showSql ? "Hide" : "Show"} the SQL
          </button>
          {showSql && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 text-[10px] leading-relaxed text-white/70">
              {data.sql}
            </pre>
          )}

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase text-white/40">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2 text-right">Feedback</th>
                  <th className="px-3 py-2 text-right">Clients</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.agents.slice(0, 8).map((a, i) => (
                  <tr key={a.agentId} className="border-t border-white/5">
                    <td className="px-3 py-2 text-white/40">{i + 1}</td>
                    <td className="px-3 py-2 font-mono">#{a.agentId}</td>
                    <td className="px-3 py-2 text-right">{a.feedbackCount}</td>
                    <td className="px-3 py-2 text-right">{a.uniqueClients}</td>
                    <td className="px-3 py-2 text-right font-semibold text-sky-300">{a.reputationScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            Ran {new Date(data.ranAt).toLocaleString()} · source: bigquery-public-data.crypto_ethereum
          </p>
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
