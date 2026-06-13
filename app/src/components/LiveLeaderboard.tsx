"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Activity, ArrowUp } from "lucide-react";

interface Row {
  agentId: string;
  name: string;
  feedbackCount: number;
  uniqueClients: number;
  reputationScore: number;
  isOurs: boolean;
}

export function LiveLeaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [prevRank, setPrevRank] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/agents", { cache: "no-store" });
    const data = await res.json();
    setSource(data.source ?? "");
    setRows(data.agents ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const ourRank = rows.findIndex((r) => r.isOurs);

  async function postFeedback() {
    setBusy(true);
    setFlash("");
    setPrevRank(ourRank >= 0 ? ourRank + 1 : null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: 100, newClient: true }),
      });
      const data = await res.json();
      if (data.leaderboard) setRows(data.leaderboard);
      setFlash(
        data.feedbackTx
          ? "Feedback posted on Ethereum → BigQuery re-ranked ✓"
          : "BigQuery leaderboard re-ranked ✓ (on-chain write pending ETH setup)"
      );
    } catch {
      setFlash("could not post feedback");
    } finally {
      setBusy(false);
    }
  }

  const isLive = source === "bigquery-table-live";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">
          Reputation leaderboard{" "}
          <span className="text-xs font-normal text-white/40">
            {isLive ? "· live BigQuery table" : "· cached snapshot"}
          </span>
        </h2>
        <button
          onClick={postFeedback}
          disabled={busy}
          className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Activity size={15} />}
          Rate our agent (post feedback)
        </button>
      </div>

      {flash && (
        <p className="mb-3 flex items-center gap-1.5 text-sm text-emerald-300">
          <ArrowUp size={14} /> {flash}
          {prevRank && ourRank >= 0 && ourRank + 1 < prevRank && (
            <span className="text-white/60">
              {" "}
              — climbed #{prevRank} → #{ourRank + 1}
            </span>
          )}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3 text-right">Feedback</th>
              <th className="px-4 py-3 text-right">Clients</th>
              <th className="px-4 py-3 text-right">Reputation</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {rows.slice(0, 15).map((a, i) => {
                const suspicious = a.uniqueClients / Math.max(a.feedbackCount, 1) < 0.4;
                return (
                  <motion.tr
                    layout
                    key={a.agentId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`border-t border-white/5 ${
                      a.isOurs ? "bg-emerald-400/10" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-4 py-3 text-white/40">{i + 1}</td>
                    <td className="px-4 py-3 font-mono">
                      {a.isOurs ? (
                        <span className="font-semibold text-emerald-300">{a.name}</span>
                      ) : (
                        a.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{a.feedbackCount}</td>
                    <td className="px-4 py-3 text-right">
                      {a.uniqueClients}
                      {suspicious && !a.isOurs && (
                        <span className="ml-2 rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                          low diversity
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-300">
                      {a.reputationScore.toLocaleString()}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-white/30">
        {isLive
          ? "Live table fractionpay.reputation.leaderboard · re-ranks when feedback posts on Ethereum · score = feedback × client-diversity"
          : "Cached mainnet snapshot · run /api/agents/setup to enable the live re-ranking table"}
      </p>
    </div>
  );
}
