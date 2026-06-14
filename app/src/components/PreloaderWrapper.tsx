"use client";

import { Preloader } from "./Preloader";

/**
 * Client-side wrapper for the Preloader — needed because layout.tsx
 * is a server component and Preloader uses client hooks.
 */
export function PreloaderWrapper({ children }: { children: React.ReactNode }) {
  return <Preloader>{children}</Preloader>;
}
