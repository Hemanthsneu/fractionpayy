"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

export interface Segment {
  label: string;
  value: number;
  color: string;
}

/** Animated allocation donut. Renders arcs proportional to each segment's value. */
export function DonutChart({ segments, size = 200, thickness = 22, centerLabel, centerSub }: {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {segments.map((seg) => {
          const frac = seg.value / total;
          const dash = frac * c;
          const offset = -acc * c;
          acc += frac;
          return (
            <motion.circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              initial={{ strokeDashoffset: -c }}
              whileInView={{ strokeDashoffset: offset }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease }}
              style={{ filter: `drop-shadow(0 0 6px ${seg.color}66)` }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerSub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerSub && <span className="text-[10px] uppercase tracking-wider text-[var(--fg)]/40">{centerSub}</span>}
          {centerLabel && <span className="font-display text-xl font-bold text-[var(--fg)]">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

/** Animated gradient area chart (line draws in, fill fades up). */
export function AreaChart({ data, width = 560, height = 160, color = "#34d3ee" }: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const id = useRef(`g${Math.random().toString(36).slice(2)}`).current;
  if (data.length < 2) data = [...data, ...data, 1];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 6;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${id})`} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease }} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease }}
        style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
      />
    </svg>
  );
}

/** Count-up number used across stat cards. */
export function CountUp({ to, prefix = "", suffix = "", decimals = 0 }: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(to * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{prefix}{val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
}
