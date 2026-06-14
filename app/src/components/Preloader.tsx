"use client";

import { motion, AnimatePresence, animate, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Cinematic preloader inspired by hatom.com — logo morph, counter 0→100%,
 * gradient progress bar, and a clip-path wipe reveal.
 * Only shows once per session (sessionStorage flag).
 */
export function Preloader({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const [done, setDone] = useState(false);
  const counterRef = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);

  // Skip if already seen this session
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("fp-loaded")) {
      setShow(false);
      setDone(true);
    }
  }, []);

  const finishLoading = useCallback(() => {
    sessionStorage.setItem("fp-loaded", "1");
    setTimeout(() => {
      setDone(true);
      setTimeout(() => setShow(false), 800);
    }, 400);
  }, []);

  // Animate counter
  useEffect(() => {
    if (!show || done) return;
    const unsub = mv.on("change", (v) => {
      if (counterRef.current) {
        counterRef.current.textContent = `${Math.round(v)}`;
      }
    });
    const controls = animate(mv, 100, {
      duration: 2.2,
      ease: [0.25, 0.1, 0.25, 1],
      onComplete: finishLoading,
    });
    return () => {
      unsub();
      controls.stop();
    };
  }, [show, done, mv, finishLoading]);

  if (!show && done) return <>{children}</>;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="preloader"
            initial={{ clipPath: "inset(0 0 0 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020408]"
          >
            {/* Ambient glow blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="aurora-blob absolute -top-1/3 left-1/4 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.15),transparent_65%)] blur-3xl" />
              <div className="aurora-blob delay absolute -bottom-1/4 right-1/3 h-[35rem] w-[35rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_65%)] blur-3xl" />
            </div>

            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 1, ease, delay: 0.1 }}
              className="relative mb-8"
            >
              <span className="text-[4rem] font-bold text-emerald-300 drop-shadow-[0_0_40px_rgba(16,185,129,0.5)] sm:text-[5.5rem]">
                ◢
              </span>
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.4 }}
              className="mb-10 flex items-center gap-3"
            >
              <span className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  FractionPay
                </span>
              </span>
            </motion.div>

            {/* Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-baseline gap-1 font-mono text-sm tracking-wider text-white/30"
            >
              <span ref={counterRef}>0</span>
              <span>%</span>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative mt-4 h-[2px] w-48 overflow-hidden rounded-full bg-white/10"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-0 origin-left bg-gradient-to-r from-emerald-400 to-cyan-400"
              />
            </motion.div>

            {/* Particle burst on exit */}
            {done && <ParticleBurst />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — hidden during preloader */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </>
  );
}

function ParticleBurst() {
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const distance = 80 + Math.random() * 120;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 0.2,
      color: i % 2 === 0 ? "rgb(16, 185, 129)" : "rgb(34, 211, 238)",
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: p.delay }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
