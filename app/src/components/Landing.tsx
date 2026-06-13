"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Building2,
  Coins,
  Nfc,
  Bot,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="relative">
      {/* ───────────── HERO ───────────── */}
      <section ref={heroRef} className="relative flex min-h-[92vh] flex-col justify-center">
        <motion.div style={{ y: heroY, opacity: heroFade }} className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/5 px-4 py-1.5 text-xs text-emerald-300"
          >
            <Sparkles size={13} /> Real-world assets, finally spendable
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.05 }}
            className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
          >
            Your portfolio is
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-cyan-300 bg-clip-text text-transparent">
              your payment method.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.15 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60"
          >
            Tokenize real estate, T-bills and funds. Earn yield as stablecoin dividends. Then tap
            to pay anywhere — an AI agent liquidates exactly the right slice, so your money works
            until the second you spend it.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.25 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3.5 font-semibold text-black transition hover:opacity-90"
            >
              Launch the app
              <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/marketplace"
              className="rounded-xl border border-white/15 px-6 py-3.5 font-medium text-white/80 transition hover:bg-white/5"
            >
              Explore the marketplace
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-14 flex flex-wrap gap-8 text-sm text-white/40"
          >
            <Stat value="$16T" label="tokenized RWA market" />
            <Stat value="34,000+" label="AI agents ranked on-chain" />
            <Stat value="Arc · ENS · BigQuery" label="settled, named, trusted" />
          </motion.div>
        </motion.div>
      </section>

      {/* ───────────── PROBLEM ───────────── */}
      <Section>
        <Reveal>
          <p className="text-sm uppercase tracking-widest text-emerald-300/70">The problem</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            You own $200K in yield-earning assets.
            <span className="text-white/40"> You still can&apos;t buy a coffee with them.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-white/55">
            Tokenized T-bills, real estate and funds earn 4–7% — but they&apos;re trapped. To
            spend, you sell everything to a stablecoin in advance and stop earning. FractionPay
            fixes the last mile.
          </p>
        </Reveal>
      </Section>

      {/* ───────────── THE FLOW (3 acts) ───────────── */}
      <Section>
        <Reveal>
          <p className="text-sm uppercase tracking-widest text-emerald-300/70">How it works</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-5xl">One complete flow.</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Act
            n="01"
            icon={<Building2 />}
            title="Tokenize & invest"
            body="An issuer tokenizes a $10M Manhattan tower into fractional shares. You buy in with USDC — real estate, treasuries, bonds, funds — and build a portfolio."
            delay={0}
          />
          <Act
            n="02"
            icon={<Coins />}
            title="Earn dividends"
            body="Rental income and yield are distributed to you as USDC dividends, pro-rata, on-chain. Your assets keep paying while you hold them."
            delay={0.12}
          />
          <Act
            n="03"
            icon={<Nfc />}
            title="Tap to spend"
            body="Tap a merchant's NFC card. An AI agent picks the least-disruptive slice to liquidate, and it settles in USDC on Arc — in one tap."
            delay={0.24}
          />
        </div>
      </Section>

      {/* ───────────── AGENT ECONOMY (Google highlight) ───────────── */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-cyan-300/80">
              <Database size={14} /> The intelligence layer
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
              We hire the agent.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                The chain trusts it.
              </span>
            </h2>
            <p className="mt-5 text-lg text-white/55">
              FractionPay doesn&apos;t decide what to sell. It ranks 34,000+ ERC-8004 agents by
              on-chain reputation using <strong className="text-white/80">Google BigQuery</strong>,
              hires the best one, and pays it $0.001 over <strong className="text-white/80">x402</strong>.
              After each payment it posts feedback back on-chain — and the BigQuery leaderboard
              re-ranks. A live machine economy.
            </p>
            <Link
              href="/agents"
              className="mt-6 inline-flex items-center gap-2 text-cyan-300 hover:underline"
            >
              See the live leaderboard <ArrowRight size={15} />
            </Link>
          </Reveal>
          <Reveal delay={0.15}>
            <LoopCard />
          </Reveal>
        </div>
      </Section>

      {/* ───────────── BUILT ON ───────────── */}
      <Section>
        <Reveal>
          <p className="text-sm uppercase tracking-widest text-emerald-300/70">Built on</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Production rails, not a prototype.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Pillar
            icon={<Coins />}
            name="Arc"
            body="USDC settlement, a yield-bearing ERC-4626 vault, and programmable stablecoin dividends."
            delay={0}
          />
          <Pillar
            icon={<Bot />}
            name="Google BigQuery"
            body="Ranks the entire on-chain agent economy — a credit bureau for autonomous agents."
            delay={0.1}
          />
          <Pillar
            icon={<ShieldCheck />}
            name="ENS"
            body="Merchants and agents are ENS names. Tap an NFC card; it resolves live from mainnet."
            delay={0.2}
          />
        </div>
      </Section>

      {/* ───────────── CTA ───────────── */}
      <Section>
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-400/10 to-cyan-400/5 p-10 text-center sm:p-16">
            <h2 className="text-3xl font-bold sm:text-5xl">Spend your portfolio. Keep earning.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/55">
              The $16 trillion RWA market, finally liquid — one tap at a time.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-semibold text-black transition hover:opacity-90"
            >
              Launch FractionPay <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
        <p className="mt-10 text-center text-xs text-white/30">
          FractionPay · ETHGlobal New York 2026 · Arc · Google Cloud · ENS
        </p>
      </Section>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="py-24 sm:py-32">{children}</section>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-white/90">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function Act({
  n,
  icon,
  title,
  body,
  delay,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur transition hover:border-emerald-300/30 hover:bg-white/[0.07]">
        <div className="flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
            {icon}
          </span>
          <span className="font-mono text-sm text-white/25">{n}</span>
        </div>
        <h3 className="mt-5 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
      </div>
    </Reveal>
  );
}

function Pillar({
  icon,
  name,
  body,
  delay,
}: {
  icon: React.ReactNode;
  name: string;
  body: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-emerald-300">
          {icon}
        </span>
        <h3 className="mt-4 font-bold">{name}</h3>
        <p className="mt-1.5 text-sm text-white/50">{body}</p>
      </div>
    </Reveal>
  );
}

function LoopCard() {
  const steps = [
    { icon: <Database size={15} />, t: "Rank 34k agents — BigQuery / mainnet" },
    { icon: <Bot size={15} />, t: "Hire the top optimizer" },
    { icon: <Coins size={15} />, t: "Pay $0.001 via x402" },
    { icon: <ShieldCheck size={15} />, t: "Post feedback → leaderboard re-ranks" },
  ];
  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/5 to-emerald-400/5 p-6">
      <p className="text-xs uppercase tracking-widest text-cyan-300/70">The reputation loop</p>
      <div className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, ease }}
            className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
              {s.icon}
            </span>
            <span className="text-sm text-white/75">{s.t}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-white/30">↻ closes on every payment</p>
    </div>
  );
}
