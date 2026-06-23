"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/sip/useScrollTrigger";

interface AnimatedNumberProps {
  value: number;
  /** formatted output function, called with the live numeric value */
  format?: (v: number) => string;
  /** duration in seconds (default 1.6) */
  duration?: number;
  /** start the animation when this element scrolls into view (default true) */
  triggerOnView?: boolean;
  /** delay in seconds */
  delay?: number;
  className?: string;
  /** start from this value instead of 0 */
  from?: number;
}

/**
 * AnimatedNumber — counts up using GSAP. Respects prefers-reduced-motion
 * (just shows the final value instantly). Optionally triggers when the
 * element scrolls into view.
 */
export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toString(),
  duration = 1.6,
  triggerOnView = true,
  delay = 0,
  className,
  from = 0,
}: AnimatedNumberProps) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const lastValueRef = useRef(from);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    // Reduced motion: just set the value
    if (reduced) {
      el.textContent = format(value);
      lastValueRef.current = value;
      return;
    }

    let active = true;
    let tween: { kill: () => void } | null = null;

    const run = () => {
      if (!active) return;
      const obj = { v: lastValueRef.current };
      import("gsap").then(({ default: gsap }) => {
        if (!active || !el) return;
        tween = gsap.to(obj, {
          v: value,
          duration,
          delay,
          ease: "power3.out",
          onUpdate: () => {
            if (el) el.textContent = format(obj.v);
          },
          onComplete: () => {
            lastValueRef.current = value;
          },
        });
      });
    };

    if (triggerOnView) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            run();
            obs.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      obs.observe(el);
      return () => {
        active = false;
        obs.disconnect();
        tween?.kill();
      };
    } else {
      run();
      return () => {
        active = false;
        tween?.kill();
      };
    }
  }, [value, format, duration, triggerOnView, delay, reduced]);

  return (
    <span ref={spanRef} className={className}>
      {format(from)}
    </span>
  );
}
