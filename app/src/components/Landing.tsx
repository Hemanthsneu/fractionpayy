"use client";

import Link from "next/link";
import Image from "next/image";
import { AreaChart } from "./Charts";
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
import {
  ArrowRight,
  Building2,
  Coins,
  Nfc,
  Bot,
  Database,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ChevronDown,
  Cpu,
  Zap,
  Globe,
  Lock,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

/* ═══════════════════════════════════════════════════════════
   MOTION PRIMITIVES
   ═══════════════════════════════════════════════════════════ */

function FullBleed({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative w-screen ml-[calc(50%-50vw)] ${className}`}>{children}</div>
  );
}

function WordReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "115%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease, delay: delay + i * 0.045 }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function CharReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={className}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease, delay: delay + i * 0.025 }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
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
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
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
        className="relative w-[330px] rounded-[26px] border border-white/15 bg-gradient-to-br from-[#0d1f17] via-[#0a1612] to-[#06100c] p-6 shadow-[0_40px_120px_-30px_rgba(16,185,129,0.5)] sm:w-[380px]"
      >
        {/* conic glow ring */}
        <div className="pointer-events-none absolute -inset-px overflow-hidden rounded-[26px]">
          <div className="spin-slow absolute -inset-[60%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.5)_40deg,transparent_120deg,transparent_240deg,rgba(34,211,238,0.4)_300deg,transparent_360deg)] opacity-50" />
          <div className="absolute inset-px rounded-[25px] bg-gradient-to-br from-[#0d1f17] via-[#0a1612] to-[#06100c]" />
        </div>

        <div style={{ transform: "translateZ(40px)" }} className="relative">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold tracking-tight text-white/90">FractionPay</span>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              RWA · spendable
            </span>
          </div>

          <p className="mt-7 font-mono text-lg tracking-[0.28em] text-white/85">
            3827 ·· 7389
          </p>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Portfolio</p>
              <p className="font-display text-3xl font-bold text-white">$214,860</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Yield</p>
              <p className="flex items-center gap-1 text-sm font-semibold text-emerald-300">
                <TrendingUp size={13} /> 5.8%
              </p>
            </div>
          </div>

          {/* live sparkline */}
          <div className="mt-3 -mx-1 h-16">
            <AreaChart data={[0.72, 0.74, 0.73, 0.78, 0.8, 0.79, 0.84, 0.88, 0.86, 0.9, 0.94, 0.93, 0.97, 1]} height={64} color="#34d399" />
          </div>

          <div className="mt-4 space-y-2">
            {[
              { s: "🏙️", n: "Manhattan REIT", v: "$92,400" },
              { s: "🏛️", n: "US T-Bill 3M", v: "$68,100" },
              { s: "🥇", n: "Tokenized Gold", v: "$54,360" },
            ].map((r) => (
              <div
                key={r.n}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
              >
                <span className="flex items-center gap-2 text-xs text-white/70">
                  <span>{r.s}</span>
                  {r.n}
                </span>
                <span className="font-mono text-xs text-white/60">{r.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.06] px-3 py-2.5">
            <Nfc size={15} className="text-cyan-300" />
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
   CHAPTER 3 — PINNED "ONE FLOW" (enhanced with horizontal panels)
   ═══════════════════════════════════════════════════════════ */

const FLOW_STEPS = [
  {
    n: "01",
    icon: <Building2 size={20} />,
    kicker: "Tokenize & invest",
    title: "A $10M tower becomes 10M shares.",
    body: "An issuer tokenizes commercial real estate, T-bills, bonds and funds. You buy in with USDC and build a portfolio of real-world assets — from $5 up.",
  },
  {
    n: "02",
    icon: <Coins size={20} />,
    kicker: "Earn dividends",
    title: "Rent and yield pay you, on-chain.",
    body: "Income is distributed to holders as USDC dividends, pro-rata, automatically. Your assets keep working the entire time you hold them.",
  },
  {
    n: "03",
    icon: <Nfc size={20} />,
    kicker: "Tap to spend",
    title: "Buy coffee with a slice of a skyscraper.",
    body: "Tap an ENS-named merchant. An AI agent picks the least-disruptive slice to liquidate and settles in USDC on Arc — your money earns until the second you spend it.",
  },
];

function PinnedFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(v < 0.34 ? 0 : v < 0.67 ? 1 : 2);
  });

  const o0 = useTransform(scrollYProgress, [0, 0.04, 0.28, 0.36], [1, 1, 1, 0]);
  const o1 = useTransform(scrollYProgress, [0.3, 0.38, 0.62, 0.7], [0, 1, 1, 0]);
  const o2 = useTransform(scrollYProgress, [0.64, 0.72, 1, 1], [0, 1, 1, 1]);
  const y0 = useTransform(scrollYProgress, [0, 0.36], [0, -40]);
  const y1 = useTransform(scrollYProgress, [0.3, 0.7], [40, -40]);
  const y2 = useTransform(scrollYProgress, [0.64, 1], [40, 0]);
  const opacities = [o0, o1, o2];
  const ys = [y0, y1, y2];

  return (
    <section ref={ref} className="relative h-[300vh] bg-[#05070a]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden bg-[#05070a]/85 backdrop-blur-sm">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* left: rail + copy */}
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">
              One complete flow
            </p>
            <div className="mt-7 space-y-6">
              {FLOW_STEPS.map((a, i) => (
                <div
                  key={a.n}
                  className="flex gap-4 transition-all duration-500"
                  style={{ opacity: active === i ? 1 : 0.25 }}
                >
                  <div className="relative flex flex-col items-center">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-500 ${
                        active === i
                          ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-300 shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)]"
                          : "border-white/10 bg-white/5 text-white/40"
                      }`}
                    >
                      {a.icon}
                    </span>
                    {i < FLOW_STEPS.length - 1 && (
                      <span className="mt-1 h-14 w-px bg-gradient-to-b from-white/15 to-transparent" />
                    )}
                  </div>
                  <div className="pt-1.5">
                    <p className="font-mono text-[11px] text-white/25">{a.n}</p>
                    <h3 className="font-display text-xl font-semibold sm:text-2xl">{a.kicker}</h3>
                    {active === i && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease }}
                        className="mt-2 max-w-md text-sm leading-relaxed text-white/50"
                      >
                        {a.body}
                      </motion.p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right: stacked cross-fading visuals */}
          <div className="relative h-[300px] sm:h-[440px]">
            {FLOW_STEPS.map((a, i) => (
              <motion.div
                key={a.n}
                style={{ opacity: opacities[i] as MotionValue<number>, y: ys[i] as MotionValue<number> }}
                className="absolute inset-0"
              >
                <FlowVisual index={i} title={a.title} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowVisual({ index, title }: { index: number; title: string }) {
  return (
    <div className="glass-card flex h-full flex-col justify-center p-6 sm:p-8">
      <h4 className="font-display text-xl font-semibold leading-tight sm:text-3xl">{title}</h4>

      {index === 0 && (
        <div className="mt-7 grid grid-cols-6 gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.02, ease }}
              className="aspect-square rounded-md bg-gradient-to-br from-emerald-400/30 to-emerald-500/5 ring-1 ring-emerald-300/20"
            />
          ))}
          <p className="col-span-6 mt-2 text-xs text-white/45">
            🏙️ Manhattan Office Tower · 10,000,000 fractional shares
          </p>
        </div>
      )}

      {index === 1 && (
        <div className="mt-7 space-y-3">
          {[
            { q: "Q1 2026", a: "+$1,240 USDC" },
            { q: "Q2 2026", a: "+$1,318 USDC" },
            { q: "Q3 2026", a: "+$1,402 USDC" },
          ].map((r, i) => (
            <motion.div
              key={r.q}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ delay: i * 0.1, ease }}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm text-white/70">
                <Coins size={15} className="text-emerald-300" /> {r.q} dividend
              </span>
              <span className="font-mono text-sm font-semibold text-emerald-300">{r.a}</span>
            </motion.div>
          ))}
        </div>
      )}

      {index === 2 && (
        <div className="mt-7 flex items-center justify-between gap-2">
          {[
            { icon: <Nfc size={18} />, l: "Tap" },
            { icon: <Cpu size={18} />, l: "Agent picks" },
            { icon: <ShieldCheck size={18} />, l: "Settle Arc" },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                transition={{ delay: i * 0.18, ease }}
                className="flex flex-col items-center gap-2"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300">
                  {s.icon}
                </span>
                <span className="text-[11px] text-white/55">{s.l}</span>
              </motion.div>
              {i < 2 && <ArrowRight size={16} className="mb-5 text-white/25" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AGENT REPUTATION LOOP (animated SVG)
   ═══════════════════════════════════════════════════════════ */

function LoopDiagram() {
  const nodes = [
    { x: 150, y: 30, label: "Rank 34k agents", sub: "BigQuery / mainnet", icon: <Database size={13} /> },
    { x: 270, y: 130, label: "Hire the best", sub: "optimizer.fractionpay.eth", icon: <Bot size={13} /> },
    { x: 150, y: 230, label: "Pay $0.001", sub: "via x402", icon: <Coins size={13} /> },
    { x: 30, y: 130, label: "Rate on-chain", sub: "→ re-rank live", icon: <ShieldCheck size={13} /> },
  ];
  return (
    <div className="glass-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">The reputation loop</p>
      <div className="relative mt-2">
        <svg viewBox="0 0 300 260" className="w-full">
          <path
            d="M150 30 Q270 30 270 130 Q270 230 150 230 Q30 230 30 130 Q30 30 150 30 Z"
            fill="none"
            stroke="rgba(34,211,238,0.35)"
            strokeWidth="1.5"
            className="dash-flow"
          />
          <circle r="4" fill="rgb(45,212,191)">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path="M150 30 Q270 30 270 130 Q270 230 150 230 Q30 230 30 130 Q30 30 150 30 Z"
            />
          </circle>
          {nodes.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r="6" fill="rgb(34,211,238)" opacity="0.85">
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
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#08110e]/90 px-2.5 py-1.5 backdrop-blur"
            style={{ left: `${(n.x / 300) * 100}%`, top: `${(n.y / 260) * 100}%` }}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/85">
              <span className="text-cyan-300">{n.icon}</span>
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
   SPONSOR / "BUILT ON" CARDS
   ═══════════════════════════════════════════════════════════ */

const SPONSORS = [
  {
    icon: <Globe size={20} />,
    name: "Arc",
    body: "USDC settlement, a yield-bearing ERC-4626 vault, and programmable stablecoin dividends.",
    color: "from-emerald-400/20 to-emerald-500/5",
  },
  {
    icon: <Database size={20} />,
    name: "Google BigQuery",
    body: "Ranks the entire on-chain agent economy — a credit bureau for autonomous agents.",
    color: "from-cyan-400/20 to-cyan-500/5",
  },
  {
    icon: <ShieldCheck size={20} />,
    name: "ENS",
    body: "Merchants and agents are ENS names. Tap an NFC card; it resolves live from mainnet.",
    color: "from-blue-400/20 to-blue-500/5",
  },
  {
    icon: <Bot size={20} />,
    name: "ERC-8004 / x402",
    body: "Agent identity, reputation registry, and per-decision micropayments over HTTP.",
    color: "from-purple-400/20 to-purple-500/5",
  },
  {
    icon: <Zap size={20} />,
    name: "Chainlink",
    body: "Price Feeds value RWAs on-chain at payment time. CRE workflow orchestrates the flow.",
    color: "from-amber-400/20 to-amber-500/5",
  },
  {
    icon: <Lock size={20} />,
    name: "World ID",
    body: "Proof-of-personhood gate before first payment — sybil-resistant, privacy-preserving.",
    color: "from-pink-400/20 to-pink-500/5",
  },
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
];

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING COMPONENT — 7 CHAPTERS
   ═══════════════════════════════════════════════════════════ */

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 160]);
  const heroFade = useTransform(heroProgress, [0, 0.85], [1, 0]);
  const cardY = useTransform(heroProgress, [0, 1], [0, 90]);

  return (
    <FullBleed className="-mt-24">

      {/* ═══════ CHAPTER 01 — HERO ═══════ */}
      <section
        id="hero"
        ref={heroRef}
        className="chapter relative px-6 pt-24"
      >
        <div className="chapter-bg">
          <Image src="/images/story/hero-cityscape.png" alt="" fill className="object-cover opacity-15 saturate-50" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070a]/60 via-[#05070a]/30 to-[#05070a]/90" />
        </div>

        <div className="chapter-content mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div style={{ y: heroY, opacity: heroFade }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/5 px-4 py-1.5 text-xs text-emerald-200/90"
            >
              <Sparkles size={13} className="text-emerald-300" />
              Real-world assets, finally spendable
            </motion.div>

            <h1 className="font-serif text-[3.4rem] font-medium leading-[0.98] tracking-[-0.03em] sm:text-[5.2rem] lg:text-[6rem]">
              <WordReveal text="Your portfolio is" />
              <br />
              <span className="shimmer-text font-serif-italic">
                <WordReveal text="your payment method." delay={0.2} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.5 }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-white/50"
            >
              Tokenize real estate, T-bills and funds. Earn yield as stablecoin dividends. Then
              tap to pay anywhere — an AI agent liquidates exactly the right slice, so your money
              works until the second you spend it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.62 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <Magnetic>
                <Link
                  href="/dashboard"
                  className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-7 py-3.5 font-semibold text-black shadow-[0_10px_40px_-10px_rgba(16,185,129,0.7)]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
                  <span className="relative">Launch the app</span>
                  <ArrowRight size={17} className="relative transition group-hover:translate-x-1" />
                </Link>
              </Magnetic>
              <Link
                href="/marketplace"
                className="rounded-xl border border-white/15 px-7 py-3.5 font-medium text-white/80 transition hover:border-white/30 hover:bg-white/5"
              >
                Explore the marketplace
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.85 }}
              className="mt-14 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4"
            >
              <HeroStat value={<Counter to={16} prefix="$" suffix="T" />} label="RWA market" />
              <HeroStat value={<Counter to={34000} suffix="+" />} label="agents ranked" />
              <HeroStat value="4–7%" label="yield, kept" />
              <HeroStat value="1 tap" label="to spend it" />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: cardY }}
            initial={{ opacity: 0, scale: 0.9, rotateY: -12 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.1, ease, delay: 0.3 }}
            className="hidden justify-center lg:flex"
          >
            <HeroCard />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/30"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ MARQUEE ═══════ */}
      <FullBleed className="border-y border-white/10 bg-white/[0.02] py-5">
        <div className="flex overflow-hidden">
          <div className="marquee-track flex shrink-0 items-center gap-10 whitespace-nowrap pr-10 text-sm font-medium text-white/40">
            {[...MARQUEE, ...MARQUEE].map((t, i) => (
              <span key={i} className="flex items-center gap-10">
                {t}
                <span className="text-emerald-400/40">◆</span>
              </span>
            ))}
          </div>
        </div>
      </FullBleed>

      {/* ═══════ CHAPTER 02 — THE PROBLEM ═══════ */}
      <section id="problem" className="chapter px-6">
        <div className="chapter-content mx-auto max-w-5xl py-28 sm:py-36">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-emerald-300/70">
              <Lock size={14} /> The problem
            </p>
          </Reveal>
          <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            <WordReveal text="You own $200K in yield-earning assets." />
            <br />
            <span className="text-white/30">
              <WordReveal text="You still can't buy a coffee with them." delay={0.12} />
            </span>
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
              Tokenized T-bills, real estate and funds earn 4–7% — but they&apos;re trapped. To
              spend, you sell everything to a stablecoin in advance and stop earning. FractionPay
              fixes the last mile.
            </p>
          </Reveal>

          {/* Animated stat blocks */}
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <TrendingUp size={18} />, value: "$200,000", label: "Portfolio value", sub: "T-bills + real estate + gold" },
              { icon: <Coins size={18} />, value: "$12,400/yr", label: "Yield earned", sub: "6.2% blended APY" },
              { icon: <Lock size={18} />, value: "$0", label: "Spendable today", sub: "Locked in illiquid positions" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={0.3 + i * 0.1}>
                <div className="glass-card glass-card-glow p-6">
                  <div className="flex items-center gap-2 text-emerald-300/70">
                    {s.icon}
                    <span className="text-xs uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className="mt-3 font-display text-2xl font-bold sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-sm text-white/40">{s.sub}</p>
                  <div className="accent-line mt-4" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CHAPTER 03/04/05 — PINNED FLOW (Tokenize → Earn → Spend) ═══════ */}
      <section id="tokenize">
        <PinnedFlow />
      </section>

      {/* ═══════ CHAPTER 05 — TAP TO SPEND (dedicated visual section) ═══════ */}
      <section id="spend" className="chapter px-6">
        <div className="chapter-content mx-auto max-w-6xl py-20">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                <Nfc size={14} /> Tap to spend
              </p>
              <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl">
                <WordReveal text="One tap." />
                <br />
                <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  <WordReveal text="Settled in seconds." delay={0.1} />
                </span>
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-5 max-w-lg text-lg text-white/50">
                  Tap an NFC card or scan a QR code. The merchant&apos;s ENS name resolves live from mainnet. An AI agent picks the optimal slice, and Arc settles in USDC.
                </p>
              </Reveal>
            </Reveal>

            <Reveal delay={0.2} y={40}>
              <div className="relative overflow-hidden rounded-3xl">
                <Image
                  src="/images/story/nfc-payment.png"
                  alt="NFC payment visualization"
                  width={600}
                  height={600}
                  className="rounded-3xl opacity-80"
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#05070a] via-transparent to-transparent" />
                {/* Overlay flow steps */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-2">
                  {[
                    { icon: <Nfc size={14} />, l: "Tap NFC" },
                    { icon: <Bot size={14} />, l: "Agent decides" },
                    { icon: <Zap size={14} />, l: "Arc settles" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.l}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.15, ease }}
                      className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#05070a]/70 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md"
                    >
                      <span className="text-cyan-300">{s.icon}</span>
                      {s.l}
                      {i < 2 && <ArrowRight size={10} className="ml-1 text-white/30" />}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════ CHAPTER 06 — AGENT ECONOMY ═══════ */}
      <section id="agents" className="chapter px-6">
        <div className="chapter-bg">
          <Image src="/images/story/agent-network.png" alt="" fill className="object-cover opacity-10 saturate-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070a]/80 via-[#05070a]/50 to-[#05070a]/90" />
        </div>

        <div className="chapter-content mx-auto grid max-w-6xl items-center gap-14 py-28 lg:grid-cols-2 sm:py-36">
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan-300/80">
              <Database size={14} /> The intelligence layer
            </p>
            <h2 className="mt-5 font-serif text-4xl font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl">
              <WordReveal text="We hire the agent." />
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                <WordReveal text="The chain trusts it." delay={0.12} />
              </span>
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 text-lg text-white/50">
                FractionPay doesn&apos;t decide what to sell. It ranks 34,000+ ERC-8004 agents by
                on-chain reputation with <strong className="text-white/85">Google BigQuery</strong>,
                hires the best, and pays it $0.001 over{" "}
                <strong className="text-white/85">x402</strong>. After each payment it posts feedback
                on-chain — and the leaderboard re-ranks live. A real machine economy.
              </p>
              <Magnetic>
                <Link
                  href="/agents"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/5 px-5 py-3 font-medium text-cyan-200 transition hover:bg-cyan-400/10"
                >
                  See the live leaderboard <ArrowRight size={15} />
                </Link>
              </Magnetic>
            </Reveal>
          </div>
          <Reveal delay={0.15} y={36}>
            <LoopDiagram />
          </Reveal>
        </div>
      </section>

      {/* ═══════ BUILT ON / SPONSORS ═══════ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Built on</p>
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              Production rails, not a prototype.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SPONSORS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08} y={30}>
                <div className="glass-card glass-card-glow group h-full p-6 transition duration-300 hover:-translate-y-1">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-emerald-300 transition group-hover:scale-110`}>
                    {p.icon}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CHAPTER 07 — CTA ═══════ */}
      <section id="cta" className="chapter px-6 py-28">
        <div className="chapter-bg">
          <Image src="/images/story/cta-aurora.png" alt="" fill className="object-cover opacity-15 saturate-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070a]/70 via-[#05070a]/40 to-[#05070a]/80" />
        </div>

        <div className="chapter-content mx-auto max-w-5xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 p-12 text-center sm:p-20">
              <div className="aurora-blob absolute -top-1/2 left-1/4 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.25),transparent_60%)] blur-3xl" />
              <div className="aurora-blob delay absolute -bottom-1/2 right-1/4 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_60%)] blur-3xl" />
              <div className="relative">
                <h2 className="font-serif text-4xl font-medium leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
                  <CharReveal text="Spend your portfolio." />
                  <br />
                  <span className="shimmer-text">
                    <CharReveal text="Keep earning." delay={0.6} />
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-lg text-white/50">
                  The $16 trillion RWA market, finally liquid — one tap at a time.
                </p>
                <Magnetic className="mt-9">
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-9 py-4 font-semibold text-black shadow-[0_10px_50px_-10px_rgba(16,185,129,0.7)]"
                  >
                    Launch FractionPay
                    <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
          <p className="mt-12 text-center text-xs text-white/25">
            FractionPay · ETHGlobal New York 2026 · Arc · Google Cloud · ENS · Chainlink · World · Dynamic
          </p>
        </div>
      </section>
    </FullBleed>
  );
}

function HeroStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-white/95">{value}</p>
      <p className="mt-0.5 text-xs text-white/45">{label}</p>
    </div>
  );
}
