"use client";

import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
  animate,
  type MotionValue,
} from "framer-motion";
import { useRef, useState } from "react";

/* ── MUI & Chakra icons via react-icons ── */
import { MdArrowOutward, MdPlayArrow, MdNfc, MdAccountBalance, MdAutoGraph, MdToken, MdSmartToy, MdSpeed, MdVerifiedUser, MdSecurity, MdLanguage, MdBolt, MdLock, MdCreditCard } from "react-icons/md";
import { FaArrowRight, FaDatabase, FaCoins, FaBuilding, FaFingerprint } from "react-icons/fa6";

const ease = [0.16, 1, 0.3, 1] as const;

/* ═══════════════════════════════════════════════════════════
   MOTION PRIMITIVES
   ═══════════════════════════════════════════════════════════ */

function FullBleed({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative w-screen ml-[calc(50%-50vw)] ${className}`}>{children}</div>
  );
}

function Reveal({
  children,
  delay = 0,
  y = 30,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.8, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const mv = useMotionValue(0);
  const [text, setText] = useState(`${prefix}0${suffix}`);

  useMotionValueEvent(mv, "change", (v) => {
    setText(
      prefix +
        v.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) +
        suffix
    );
  });

  return (
    <motion.span
      onViewportEnter={() => {
        const controls = animate(mv, to, { duration: 1.6, ease });
        return () => controls.stop();
      }}
      viewport={{ once: true }}
    >
      {text}
    </motion.span>
  );
}

function Magnetic({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className={`inline-block ${className}`}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION LABEL
   ═══════════════════════════════════════════════════════════ */

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[var(--fg)]/40">
      <span>({num})</span>
      <span className="h-px w-3 bg-current opacity-40" />
      <span>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO CARD (3D tilt + float)
   ═══════════════════════════════════════════════════════════ */

function HeroCard() {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 150, damping: 18 });
  const ry = useSpring(0, { stiffness: 150, damping: 18 });

  return (
    <div className="float" style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", boxShadow: '0 80px 160px -30px rgba(0,0,0,0.6)' }}
        onMouseMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          ry.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 18);
          rx.set((-(e.clientY - (r.top + r.height / 2)) / r.height) * 18);
        }}
        onMouseLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        className="neon-border relative w-[330px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-2xl sm:w-[380px]"
      >
        {/* top-edge glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--citrus)] to-transparent opacity-60" />

        <div style={{ transform: "translateZ(40px)" }} className="relative">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold tracking-tight text-white">FractionPay</span>
            <span className="rounded-full border border-[var(--citrus)]/30 bg-[var(--citrus)]/10 px-2.5 py-1 text-[10px] font-medium" style={{ color: 'var(--citrus)' }}>
              RWA · spendable
            </span>
          </div>

          <p className="mt-7 font-mono text-lg tracking-[0.28em] text-white/85">
            3827 ·· 7389
          </p>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Portfolio</p>
              <p className="text-2xl font-bold text-white">$214,860</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Yield</p>
              <p className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--sage)' }}>
                <MdAutoGraph size={15} /> 5.8%
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {[
              { s: "🏙️", n: "Manhattan REIT", v: "$92,400" },
              { s: "🏛️", n: "US T-Bill 3M", v: "$68,100" },
              { s: "🥇", n: "Tokenized Gold", v: "$54,360" },
            ].map((r) => (
              <div
                key={r.n}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <span className="flex items-center gap-2 text-xs text-white/70">
                  <span>{r.s}</span>
                  {r.n}
                </span>
                <span className="font-mono text-xs text-white/60">{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-[var(--sage)]/20 bg-[var(--sage)]/[0.06] px-3 py-2.5">
            <MdNfc size={17} style={{ color: 'var(--sage)' }} />
            <span className="text-[11px] text-white/70">
              Tap to pay — agent liquidates the right slice
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REDESIGNED FLOW — horizontal step cards
   ═══════════════════════════════════════════════════════════ */

const FLOW_STEPS = [
  {
    n: "01",
    icon: <MdAccountBalance size={28} />,
    title: "Tokenize & invest",
    headline: "A $10M tower becomes 10M shares.",
    body: "An issuer tokenizes real estate, T-bills, bonds and funds. You invest from $5 in USDC and build a portfolio of yield-bearing real-world assets.",
    color: "var(--citrus)",
    visual: (
      <div className="grid grid-cols-6 gap-1.5 mt-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, ease }}
            className="aspect-square rounded-md bg-[var(--citrus)]/15 border border-[var(--citrus)]/20"
          />
        ))}
      </div>
    ),
  },
  {
    n: "02",
    icon: <FaCoins size={24} />,
    title: "Earn dividends",
    headline: "Rent and yield pay you, on-chain.",
    body: "Income is distributed as USDC dividends, pro-rata, automatically. Your assets keep working every second you hold them.",
    color: "var(--sage)",
    visual: (
      <div className="mt-4 space-y-2.5">
        {[
          { q: "Q1 2026", a: "+$1,240" },
          { q: "Q2 2026", a: "+$1,318" },
          { q: "Q3 2026", a: "+$1,402" },
        ].map((r, i) => (
          <motion.div
            key={r.q}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.12, ease }}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm text-white/70">
              <FaCoins size={13} className="text-[var(--sage)]" /> {r.q}
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--sage)]">{r.a}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    n: "03",
    icon: <MdNfc size={28} />,
    title: "Tap to spend",
    headline: "Buy coffee with a skyscraper slice.",
    body: "Tap your phone at any ENS-named merchant. An AI agent picks the least-disruptive asset to liquidate and settles in USDC — your money earns until the second you spend it.",
    color: "var(--gold)",
    visual: (
      <div className="mt-4 flex items-center justify-between gap-3">
        {[
          { icon: <MdNfc size={20} />, l: "Tap" },
          { icon: <MdSmartToy size={20} />, l: "Agent" },
          { icon: <MdBolt size={20} />, l: "Settle" },
        ].map((s, i) => (
          <div key={s.l} className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18, ease }}
              className="flex flex-col items-center gap-2"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: 'rgba(212, 168, 67, 0.08)',
                  borderColor: 'rgba(212, 168, 67, 0.18)',
                  color: 'var(--gold)',
                }}
              >
                {s.icon}
              </span>
              <span className="text-[11px] text-white/55">{s.l}</span>
            </motion.div>
            {i < 2 && <FaArrowRight size={12} className="mb-5 text-white/20" />}
          </div>
        ))}
      </div>
    ),
  },
];

/* ═══════════════════════════════════════════════════════════
   AGENT REPUTATION LOOP
   ═══════════════════════════════════════════════════════════ */

function LoopDiagram() {
  const nodes = [
    { x: 150, y: 30, label: "Rank 34k agents", sub: "BigQuery / mainnet", icon: <FaDatabase size={11} /> },
    { x: 270, y: 130, label: "Hire the best", sub: "optimizer.fractionpay.eth", icon: <MdSmartToy size={13} /> },
    { x: 150, y: 230, label: "Pay $0.001", sub: "via x402", icon: <FaCoins size={11} /> },
    { x: 30, y: 130, label: "Rate on-chain", sub: "→ re-rank live", icon: <MdVerifiedUser size={13} /> },
  ];
  return (
    <div className="glass-card glass-card-glow p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">The reputation loop</p>
      <div className="relative mt-2">
        <svg viewBox="0 0 300 260" className="w-full">
          <path
            d="M150 30 Q270 30 270 130 Q270 230 150 230 Q30 230 30 130 Q30 30 150 30 Z"
            fill="none"
            stroke="rgba(125,174,107,0.35)"
            strokeWidth="1.5"
            className="dash-flow"
          />
          <circle r="4" fill="var(--sage)">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path="M150 30 Q270 30 270 130 Q270 230 150 230 Q30 230 30 130 Q30 30 150 30 Z"
            />
          </circle>
          {nodes.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r="6" fill="var(--sage)" opacity="0.85">
              <animate
                attributeName="r"
                values="6;9;6"
                dur="2.5s"
                begin={`${i * 0.6}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
        {nodes.map((n, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 * i, ease }}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/[0.08] bg-[var(--bg)]/90 px-2.5 py-1.5 backdrop-blur"
            style={{ left: `${(n.x / 300) * 100}%`, top: `${(n.y / 260) * 100}%` }}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/85">
              <span className="text-[var(--sage)]">{n.icon}</span>
              {n.label}
            </span>
            <span className="text-[9px] text-white/40">{n.sub}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-white/30">↻ closes on every payment</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SPONSORS
   ═══════════════════════════════════════════════════════════ */

const SPONSORS = [
  { icon: <MdLanguage size={22} />, name: "Arc", body: "USDC settlement, a yield-bearing ERC-4626 vault, and programmable stablecoin dividends.", color: "var(--citrus)" },
  { icon: <FaDatabase size={18} />, name: "Google BigQuery", body: "Ranks the entire on-chain agent economy — a credit bureau for autonomous agents.", color: "var(--sage)" },
  { icon: <MdSecurity size={22} />, name: "ENS", body: "Merchants and agents are ENS names. Tap an NFC card; it resolves live from mainnet.", color: "var(--gold)" },
  { icon: <MdSmartToy size={22} />, name: "ERC-8004 / x402", body: "Agent identity, reputation registry, and per-decision micropayments over HTTP.", color: "var(--citrus)" },
  { icon: <MdBolt size={22} />, name: "Chainlink", body: "Price Feeds value RWAs on-chain at payment time. CRE workflow orchestrates the flow.", color: "var(--sage)" },
  { icon: <MdLock size={22} />, name: "World ID", body: "Proof-of-personhood gate before first payment — sybil-resistant, privacy-preserving.", color: "var(--gold)" },
];

/* ═══════════════════════════════════════════════════════════
   MARQUEE DATA
   ═══════════════════════════════════════════════════════════ */

const MARQUEE = [
  "Manhattan Office Tower",
  "US T-Bills",
  "Tokenized Gold",
  "Apple 2030 Bonds",
  "Money Market Fund",
  "Commercial Real Estate",
  "Fractional Real Estate",
  "Yield-Bearing Assets",
];

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <FullBleed className="-mt-24">

      {/* ═══════ CHAPTER 01 — HERO ═══════ */}
      <section
        id="hero"
        ref={heroRef}
        className="chapter relative px-6 pt-32"
      >
        <div className="chapter-bg">
          <Image src="/images/story/hero-cityscape.png" alt="" fill className="object-cover opacity-[0.10] saturate-50 brightness-50" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/60 via-[var(--bg)]/30 to-[var(--bg)]/90" />
        </div>

        <div className="chapter-content mx-auto flex w-full max-w-[1400px] flex-col px-0 md:px-4">
          {/* Top meta bar */}
          <div className="flex items-center justify-between mb-12 md:mb-20">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/40">
              <span className="h-1.5 w-1.5 rounded-full animate-blink shadow-[0_0_12px_var(--citrus)]" style={{ background: 'var(--citrus)' }} />
              v1.0 · ETHGlobal NY 2026
            </div>
            <div className="hidden md:flex items-center gap-3">
              <SectionLabel num="01" label="The intro" />
            </div>
          </div>

          {/* Hero headline — uses animate (not whileInView) so it always fires */}
          <h1 className="relative">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.1 }}
            >
              <span className="block text-[clamp(3.5rem,11vw,11rem)] font-medium tracking-[-0.045em] leading-[0.88] text-white">
                A new
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.22 }}
              className="mt-1 md:mt-3"
            >
              <span className="text-[clamp(3.5rem,11vw,11rem)] leading-[0.88] tracking-[-0.025em]">
                <span className="font-display italic font-normal glow-text" style={{ color: 'var(--citrus)' }}>era </span>
                <span className="font-medium tracking-[-0.045em] text-white">of</span>
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease, delay: 0.34 }}
              className="mt-1 md:mt-3"
            >
              <span className="block text-[clamp(3.5rem,11vw,11rem)] font-medium tracking-[-0.045em] leading-[0.88] text-white">
                payments.
              </span>
            </motion.div>
          </h1>

          {/* Sub-content grid */}
          <div className="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
            <div className="md:col-span-5 md:col-start-2">
              <Reveal>
                <div className="flex items-start gap-4">
                  <span className="mt-2 h-px w-8 shrink-0" style={{ background: 'var(--citrus)' }} />
                  <p className="text-white/60 text-[15px] md:text-[17px] leading-[1.55] max-w-[440px]">
                    FractionPay pairs <span className="font-display italic text-white">tokenized real-world assets</span> with an AI agent economy, so your portfolio earns yield until the second you{" "}
                    <span className="font-display italic" style={{ color: 'var(--citrus)' }}>tap to spend</span>.
                  </p>
                </div>
              </Reveal>
            </div>
            <div className="md:col-span-5 md:col-start-8 flex flex-col items-start md:items-end gap-6">
              <Reveal delay={0.1}>
                <div className="flex items-center gap-4">
                  <Magnetic>
                    <Link href="/dashboard" className="magnetic inline-block group">
                      <span className="relative inline-flex items-center gap-3 px-7 py-4 rounded-full text-[14px] font-medium overflow-hidden text-[var(--paper)]" style={{ background: 'var(--citrus)' }}>
                        <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <span className="relative group-hover:text-[var(--bg)] transition-colors duration-500">Launch the app</span>
                        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black/15 group-hover:bg-[var(--bg)] transition-colors duration-500">
                          <MdArrowOutward size={16} className="group-hover:text-[var(--citrus)] transition-colors" />
                        </span>
                      </span>
                    </Link>
                  </Magnetic>
                  <Link href="#tokenize" className="group inline-flex items-center gap-3 text-[13px] text-white/60 hover:text-white transition-colors">
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/15 group-hover:border-white/40 transition-all">
                      <MdPlayArrow size={18} />
                    </span>
                    See how it works
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-20 md:mt-32 grid grid-cols-3 md:grid-cols-4 gap-8 md:gap-12 border-t border-white/[0.08] pt-10"
          >
            <div>
              <div className="text-[clamp(2rem,3.5vw,3.5rem)] tracking-[-0.04em] font-medium text-white">
                <Counter to={16} prefix="$" suffix="T" />
              </div>
              <div className="text-[11px] text-white/40 mt-2 max-w-[180px] leading-snug">RWA market, now spendable</div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <div className="text-[clamp(2rem,3.5vw,3.5rem)] tracking-[-0.04em] font-medium text-white">
                  <Counter to={34000} suffix="" />
                </div>
                <span className="text-white/35 text-sm">+</span>
              </div>
              <div className="text-[11px] text-white/40 mt-2 max-w-[180px] leading-snug">Agents ranked by reputation</div>
            </div>
            <div>
              <div className="text-[clamp(2rem,3.5vw,3.5rem)] tracking-[-0.04em] font-medium text-white">4–7%</div>
              <div className="text-[11px] text-white/40 mt-2 max-w-[180px] leading-snug">Yield earned until you spend</div>
            </div>
            <div className="hidden md:block">
              <div className="text-[clamp(2rem,3.5vw,3.5rem)] tracking-[-0.04em] font-medium" style={{ color: 'var(--citrus)' }}>1 tap</div>
              <div className="text-[11px] text-white/40 mt-2 max-w-[180px] leading-snug">To spend any fraction</div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-white/40"
        >
          <span className="text-[10px] uppercase tracking-[0.35em]">Scroll to explore</span>
          <div className="relative h-14 w-px overflow-hidden bg-gradient-to-b from-white/25 to-transparent">
            <div className="h-4 w-full animate-scroll-line" style={{ background: 'var(--citrus)' }} />
          </div>
        </motion.div>
      </section>

      {/* ═══════ MARQUEE ═══════ */}
      <FullBleed className="border-y border-white/[0.06] bg-white/[0.015] py-14">
        <div className="flex overflow-hidden">
          <div className="marquee-track flex shrink-0 items-center gap-14 whitespace-nowrap pr-14">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
              <span key={i} className="flex items-center gap-14 shrink-0">
                <span className="text-[clamp(1.5rem,2.5vw,2.25rem)] font-display italic text-white/80">{t}</span>
                <span className="text-2xl" style={{ color: 'var(--citrus)' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </FullBleed>

      {/* ═══════ CHAPTER 02 — THE PROBLEM ═══════ */}
      <section id="problem" className="chapter px-6">
        <div className="chapter-content mx-auto max-w-[1400px] py-32 md:py-48 px-0 md:px-4">
          <Reveal>
            <SectionLabel num="02" label="The problem" />
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-12 text-[clamp(1.75rem,4vw,3.6rem)] leading-[1.18] tracking-[-0.025em] text-white max-w-[1200px] font-medium">
              You own $200K in yield-earning assets. But you{" "}
              <span className="font-display italic font-normal" style={{ color: 'var(--citrus)' }}>can&apos;t buy a coffee</span>{" "}
              with them. Every{" "}
              <span className="font-display italic font-normal" style={{ color: 'var(--sage)' }}> payment </span>
              requires selling everything in advance. Your money stops{" "}
              <span className="font-display italic font-normal" style={{ color: 'var(--gold)' }}>earning</span> the moment you need it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════ CHAPTER 03 — THE FLOW (redesigned: card grid) ═══════ */}
      <section id="tokenize" className="px-6 py-20 md:py-32">
        <div className="mx-auto max-w-[1400px] px-0 md:px-4">
          <Reveal>
            <SectionLabel num="03" label="One complete flow" />
            <h2 className="mt-6 text-[clamp(2.25rem,5vw,4.5rem)] font-medium tracking-[-0.04em] leading-[1.05] text-white max-w-[820px]">
              From <span className="font-display italic font-normal" style={{ color: 'var(--citrus)' }}>investment</span> to{" "}
              <span className="font-display italic font-normal" style={{ color: 'var(--gold)' }}>payment</span>.<br />
              One seamless loop.
            </h2>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {FLOW_STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.1} y={40}>
                <div className="glass-card glass-card-glow group relative p-7 md:p-8 h-full flex flex-col overflow-hidden">
                  {/* Step number + icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${step.color} 8%, transparent)`,
                        borderColor: `color-mix(in srgb, ${step.color} 18%, transparent)`,
                        color: step.color,
                      }}
                    >
                      {step.icon}
                    </div>
                    <span className="font-mono text-[11px] text-white/20">{step.n}</span>
                  </div>

                  {/* Title & body */}
                  <p className="text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: step.color }}>{step.title}</p>
                  <h3 className="font-display text-xl italic font-normal leading-tight sm:text-2xl text-white mb-3">{step.headline}</h3>
                  <p className="text-[13px] text-white/50 leading-[1.65] mb-auto">{step.body}</p>

                  {/* Interactive visual */}
                  {step.visual}

                  {/* Background number watermark */}
                  <div className="absolute -right-4 -bottom-6 text-[120px] font-display italic leading-none opacity-[0.03] pointer-events-none select-none" style={{ color: step.color }}>
                    {i + 1}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CHAPTER 04 — TAP TO SPEND ═══════ */}
      <section id="spend" className="chapter px-6">
        <div className="chapter-content mx-auto max-w-6xl py-20">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <SectionLabel num="04" label="Tap to spend" />
              <h2 className="mt-5 text-[clamp(2.25rem,5vw,4.5rem)] font-medium tracking-[-0.04em] leading-[1.05] text-white max-w-[820px]">
                One <span className="font-display italic font-normal" style={{ color: 'var(--gold)' }}>tap</span>.<br />
                Settled in seconds.
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-5 max-w-lg text-[15px] text-white/50 leading-[1.6]">
                  Tap an NFC card or scan a QR code. The merchant&apos;s ENS name resolves live from mainnet. An AI agent picks the optimal slice, and Arc settles in USDC.
                </p>
              </Reveal>
            </Reveal>

            <Reveal delay={0.2} y={40}>
              <div className="neon-border relative overflow-hidden rounded-[28px] border border-white/[0.08]">
                <Image
                  src="/images/story/nfc-payment.png"
                  alt="NFC payment visualization"
                  width={600}
                  height={600}
                  className="rounded-[28px] opacity-75"
                />
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-2">
                  {[
                    { icon: <MdNfc size={14} />, l: "Tap NFC" },
                    { icon: <MdSmartToy size={14} />, l: "Agent decides" },
                    { icon: <MdBolt size={14} />, l: "Arc settles" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.l}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.15, ease }}
                      className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[var(--bg)]/70 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md"
                    >
                      <span className="text-[var(--sage)]">{s.icon}</span>
                      {s.l}
                      {i < 2 && <FaArrowRight size={8} className="ml-1 text-white/30" />}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════ CHAPTER 05 — AGENT ECONOMY ═══════ */}
      <section id="agents" className="chapter px-6">
        <div className="chapter-bg">
          <Image src="/images/story/agent-network.png" alt="" fill className="object-cover opacity-[0.08] saturate-50 brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/80 via-[var(--bg)]/50 to-[var(--bg)]/90" />
        </div>

        <div className="chapter-content mx-auto grid max-w-6xl items-center gap-14 py-28 lg:grid-cols-2 sm:py-36">
          <div>
            <SectionLabel num="05" label="The intelligence layer" />
            <h2 className="mt-5 text-[clamp(2.25rem,5vw,4.5rem)] font-medium tracking-[-0.04em] leading-[1.05] text-white max-w-[820px]">
              We hire the <span className="font-display italic font-normal" style={{ color: 'var(--sage)' }}>agent</span>.<br />
              The chain <span className="font-display italic font-normal" style={{ color: 'var(--citrus)' }}>trusts</span> it.
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 text-[15px] text-white/50 leading-[1.6]">
                FractionPay doesn&apos;t decide what to sell. It ranks 34,000+ ERC-8004 agents by
                on-chain reputation with <strong className="text-white/85">Google BigQuery</strong>,
                hires the best, and pays it $0.001 over{" "}
                <strong className="text-white/85">x402</strong>. After each payment it posts feedback
                on-chain — and the leaderboard re-ranks live.
              </p>
              <Magnetic>
                <Link
                  href="/agents"
                  className="mt-7 inline-flex items-center gap-2 text-[12px] font-medium group"
                  style={{ color: 'var(--sage)' }}
                >
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">See the live leaderboard</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current/30 group-hover:bg-current/10 transition-all">
                    <MdArrowOutward size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </Link>
              </Magnetic>
            </Reveal>
          </div>
          <Reveal delay={0.15} y={36}>
            <LoopDiagram />
          </Reveal>
        </div>
      </section>

      {/* ═══════ CAPABILITIES / SPONSORS ═══════ */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1400px] px-0 md:px-4">
          <Reveal>
            <div className="flex items-end justify-between gap-6 mb-16">
              <div>
                <SectionLabel num="06" label="Built on" />
                <h2 className="mt-6 text-[clamp(2.25rem,5vw,4.5rem)] font-medium tracking-[-0.04em] leading-[1.05] text-white max-w-[820px]">
                  Production <span className="font-display italic font-normal" style={{ color: 'var(--sage)' }}>rails</span>,<br /> not a prototype.
                </h2>
              </div>
              <p className="hidden md:block text-[13px] text-white/40 max-w-[260px] leading-relaxed pb-3">Six integrations, one flow. Designed for the payment loop you actually live in.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {SPONSORS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.06} y={30}>
                <div className="glass-card glass-card-glow group relative p-7 md:p-9 transition-all duration-700 overflow-hidden" style={{ transitionDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between mb-8">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${p.color} 8%, transparent)`,
                        borderColor: `color-mix(in srgb, ${p.color} 18%, transparent)`,
                        color: p.color,
                      }}
                    >
                      {p.icon}
                    </div>
                    <div className="text-[11px] tabular-nums text-white/20">{String(i + 1).padStart(2, '0')}</div>
                  </div>
                  <h3 className="text-[clamp(1.25rem,1.6vw,1.6rem)] font-medium text-white mb-4 tracking-[-0.02em] leading-[1.2]">{p.name}</h3>
                  <p className="text-[13.5px] text-white/50 leading-[1.65]">{p.body}</p>
                  <div className="mt-8 flex items-center gap-2 text-[12px] font-medium" style={{ color: p.color }}>
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">Learn more</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current/30 group-hover:bg-current/10 transition-all">
                      <MdArrowOutward size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                  <div className="absolute -right-6 -bottom-6 text-[140px] font-display italic leading-none opacity-[0.025] pointer-events-none select-none" style={{ color: p.color }}>
                    {i + 1}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CHAPTER 07 — CTA ═══════ */}
      <section id="cta" className="chapter px-6 py-28">
        <div className="chapter-bg">
          <Image src="/images/story/cta-aurora.png" alt="" fill className="object-cover opacity-[0.10] saturate-50 brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/70 via-[var(--bg)]/40 to-[var(--bg)]/80" />
        </div>

        <div className="chapter-content mx-auto max-w-5xl">
          <Reveal>
            <div className="neon-border relative overflow-hidden rounded-[28px] border border-white/[0.06] p-12 text-center sm:p-20">
              {/* Ambient glows */}
              <div className="aurora-blob absolute -top-1/2 left-1/4 h-[30rem] w-[30rem] rounded-full opacity-[0.2] blur-[60px]" style={{ background: 'radial-gradient(circle, var(--citrus), transparent 60%)' }} />
              <div className="aurora-blob delay absolute -bottom-1/2 right-1/4 h-[30rem] w-[30rem] rounded-full opacity-[0.14] blur-[60px]" style={{ background: 'radial-gradient(circle, var(--sage), transparent 60%)' }} />
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--citrus)] to-transparent opacity-70" />

              <div className="relative">
                <h2 className="text-[clamp(2.25rem,5vw,4.5rem)] font-medium tracking-[-0.04em] leading-[1.05] text-white">
                  Spend your <span className="font-display italic font-normal" style={{ color: 'var(--citrus)' }}>portfolio</span>.<br />
                  Keep <span className="font-display italic font-normal" style={{ color: 'var(--sage)' }}>earning</span>.
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-[15px] text-white/45 leading-[1.6]">
                  The $16 trillion RWA market, finally liquid — one tap at a time.
                </p>
                <Magnetic className="mt-9">
                  <Link href="/dashboard" className="magnetic inline-block group">
                    <span className="relative inline-flex items-center gap-3 px-9 py-4 rounded-full text-[14px] font-medium overflow-hidden text-[var(--paper)]" style={{ background: 'var(--citrus)' }}>
                      <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                      <span className="relative group-hover:text-[var(--bg)] transition-colors duration-500">Launch FractionPay</span>
                      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-black/15 group-hover:bg-[var(--bg)] transition-colors duration-500">
                        <MdArrowOutward size={16} className="group-hover:text-[var(--citrus)] transition-colors" />
                      </span>
                    </span>
                  </Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
          <p className="mt-12 text-center text-[11px] text-white/25">
            FractionPay · ETHGlobal New York 2026 · Arc · Google Cloud · ENS · Chainlink · World · Dynamic
          </p>
        </div>
      </section>
    </FullBleed>
  );
}
