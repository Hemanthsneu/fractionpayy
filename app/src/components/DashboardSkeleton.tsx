"use client";

import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Premium glass skeleton loading state for the dashboard.
 * Pulsing shimmer cards that match the dashboard layout.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-3 w-20" />
          <div className="skeleton mt-3 h-9 w-56" />
          <div className="skeleton mt-2 h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-10 w-24 rounded-xl" />
          <div className="skeleton h-10 w-20 rounded-xl" />
        </div>
      </div>

      {/* Hero: chart + donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="glass-card lg:col-span-2 p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="skeleton h-3 w-32" />
              <div className="skeleton mt-3 h-12 w-48" />
              <div className="skeleton mt-2 h-4 w-40" />
            </div>
            <div className="skeleton h-7 w-24 rounded-full" />
          </div>
          <div className="skeleton mt-6 h-32 w-full rounded-xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.08 }}
          className="glass-card p-6"
        >
          <div className="skeleton h-3 w-20" />
          <div className="mt-4 flex justify-center">
            <div className="skeleton h-44 w-44 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-4 w-full" />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Stat strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: i * 0.05 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2">
              <div className="skeleton h-9 w-9 rounded-lg" />
              <div className="skeleton h-4 w-24" />
            </div>
            <div className="skeleton mt-4 h-7 w-28" />
            <div className="skeleton mt-2 h-3 w-20" />
          </motion.div>
        ))}
      </div>

      {/* Holdings + actions */}
      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.2 }}
          className="glass-card lg:col-span-2 p-6"
        >
          <div className="flex items-center justify-between">
            <div className="skeleton h-6 w-24" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="mt-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-xl" />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.25 }}
          className="glass-card p-6"
        >
          <div className="skeleton h-6 w-28" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
