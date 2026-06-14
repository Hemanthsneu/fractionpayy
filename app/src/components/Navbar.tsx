"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowOutward, MdMenu, MdClose } from "react-icons/md";
import { DynamicWidget, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Invest" },
  { href: "/property", label: "Property" },
  { href: "/agents", label: "Agents" },
  { href: "/merchants", label: "Merchants" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isLoggedIn = useIsLoggedIn();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] py-3 ${
        scrolled
          ? "border-b border-[var(--fg)]/[0.06] bg-[var(--bg)]/80 backdrop-blur-2xl shadow-[0_4px_30px_-4px_rgba(0,0,0,0.4)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 md:px-10">
        {/* Logo — Offerly style */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full group-hover:scale-110 transition-transform duration-500" style={{ background: 'var(--citrus)' }} />
            <div className="absolute inset-[3px] rounded-full flex items-center justify-center text-[var(--fg)] font-display italic text-sm" style={{ background: 'var(--bg)' }}>
              F<span style={{ color: 'var(--citrus)' }}>p</span>
            </div>
          </div>
          <span className="text-[var(--fg)] font-medium tracking-tight text-[14px]">
            Fraction<span className="font-display italic" style={{ color: 'var(--citrus)' }}>Pay</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 px-1 py-1 rounded-full md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-full px-4 py-2 text-[12.5px] transition-colors duration-300 ${
                  active
                    ? "text-[var(--fg)]"
                    : "text-[var(--fg)]/55 hover:text-[var(--fg)] hover:bg-[var(--fg)]/[0.04]"
                }`}
              >
                {l.label}
                {active && (
                  <>
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-[var(--fg)]/[0.05]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(to right, var(--citrus), var(--sage))' }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  </>
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <DynamicWidget variant="modal" />
          {!isLoggedIn ? (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex magnetic group"
            >
              <span className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12.5px] font-medium bg-[var(--fg)] text-[var(--bg)] overflow-hidden">
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: 'var(--citrus)' }} />
                <span className="relative group-hover:text-[var(--paper)] transition-colors duration-500">Get started</span>
                <MdArrowOutward size={14} className="relative group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--paper)] transition-all duration-300" />
              </span>
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex magnetic group"
            >
              <span className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12.5px] font-medium overflow-hidden border border-[var(--citrus)]/30" style={{ color: 'var(--citrus)' }}>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ background: 'var(--citrus)' }} />
                <span className="relative group-hover:text-[var(--paper)] transition-colors duration-500">Dashboard</span>
                <MdArrowOutward size={14} className="relative group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--paper)] transition-all duration-300" />
              </span>
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--fg)]/[0.10] hover:border-[var(--fg)]/[0.25] text-[var(--fg)]/70 md:hidden transition-colors"
          >
            {open ? <MdClose size={18} /> : <MdMenu size={18} />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-[var(--fg)]/[0.08] bg-[var(--bg)]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-xl px-3.5 py-2.5 text-[13px] transition ${
                    pathname === l.href
                      ? "bg-[var(--fg)]/[0.05] text-[var(--fg)]"
                      : "text-[var(--fg)]/55 hover:bg-[var(--fg)]/[0.03] hover:text-[var(--fg)]"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
