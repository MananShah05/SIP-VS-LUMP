/**
 * useScrollTrigger — thin wrapper around GSAP ScrollTrigger that
 * respects prefers-reduced-motion.
 */

"use client";

import { useEffect, useState, useRef, type RefObject } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Register a GSAP ScrollTrigger-driven animation. The `ref` is
 * passed in by the caller (avoids any TDZ/linter complaints).
 * Cleanup on unmount.
 */
export function useGsapRegister(
  ref: RefObject<HTMLElement | null>,
  cb: (
    gsap: typeof import("gsap"),
    ScrollTrigger: typeof import("gsap/ScrollTrigger")
  ) => void | (() => void),
  deps: unknown[] = []
): void {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let cleanup: void | (() => void);
    let active = true;

    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      if (!active) return;
      cleanup = cb(gsap, ScrollTrigger);
    })();

    return () => {
      active = false;
      if (typeof cleanup === "function") cleanup();
    };
  }, [reduced, ...deps]);
}
