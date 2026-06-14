"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const CHAPTERS = [
  { id: "hero", label: "Home" },
  { id: "problem", label: "The Problem" },
  { id: "tokenize", label: "The Flow" },
  { id: "spend", label: "Tap to Spend" },
  { id: "agents", label: "Agent Economy" },
  { id: "cta", label: "Get Started" },
];

/**
 * Floating side navigation dots — hatom-style.
 * Tracks current chapter via IntersectionObserver,
 * clicking smooth-scrolls to that section.
 */
export function ChapterNav() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  // Show after preloader completes; also reveal as soon as the user scrolls.
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2200);
    const onScroll = () => { if (window.scrollY > 80) setVisible(true); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, []);

  // Track the active section by which one crosses the viewport center.
  // (Robust for any height — IntersectionObserver thresholds fail on tall
  // pinned sections like the 300vh flow.)
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const center = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      CHAPTERS.forEach((ch, i) => {
        const el = document.getElementById(ch.id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const inside = r.top <= center && r.bottom >= center;
        const dist = inside ? 0 : Math.min(Math.abs(r.top - center), Math.abs(r.bottom - center));
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActive(best);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-4 max-md:hidden"
      aria-label="Chapter navigation"
    >
      {CHAPTERS.map((ch, i) => (
        <div key={ch.id} className="group relative flex items-center">
          {/* Tooltip */}
          <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-lg border border-[var(--fg)]/[0.08] bg-[var(--bg)]/90 px-3 py-1.5 text-xs font-medium text-[var(--fg)]/80 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:-translate-x-1" style={{ boxShadow: '0 4px 20px -4px var(--c-shadow-strong)' }}>
            {ch.label}
          </span>
          {/* Dot */}
          <button
            onClick={() => scrollTo(ch.id)}
            className={`chapter-dot ${active === i ? "active" : ""}`}
            aria-label={`Go to ${ch.label}`}
          />
        </div>
      ))}
    </motion.nav>
  );
}
