"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";

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

  // Show after preloader completes (delay)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    CHAPTERS.forEach((ch, i) => {
      const el = document.getElementById(ch.id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(i);
        },
        { threshold: 0.4 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
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
          <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-lg bg-[#0a1612]/90 px-3 py-1.5 text-xs font-medium text-white/80 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:-translate-x-1">
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
