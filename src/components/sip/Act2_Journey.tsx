"use client";

import { useRef } from "react";
import { useCalc } from "@/hooks/sip/useCalc";
import { useGsapRegister } from "@/hooks/sip/useScrollTrigger";
import { WealthChart } from "./ui/WealthChart";

/**
 * Section 3 — The Journey.
 * A short intro section, then the pinned WealthChart (4 viewports
 * of scroll space), then a transition line into Section 4.
 */
export function Act2_Journey() {
  const { timeline, showReal, inputs } = useCalc();
  const ref = useRef<HTMLElement | null>(null);
  const chartScrollHeight =
    inputs.years <= 10 ? 3.5 : inputs.years <= 20 ? 4 : inputs.years <= 30 ? 4.75 : 5.25;

  useGsapRegister(ref, (gsap) => {
    gsap.from(".act2-intro", {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 75%",
        toggleActions: "play none none reverse",
      },
    });
  });

  return (
    <>
      <section
        ref={ref}
        id="act2-intro"
        className="act-section relative min-h-[60svh] flex flex-col items-center justify-center px-5 sm:px-8 py-16 sm:py-20"
      >
        <div className="w-full max-w-3xl mx-auto text-center">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-4">
            Section 3 — The Journey
          </div>
          <h2 className="act2-intro font-display text-[clamp(2rem,5.5vw,3.8rem)] leading-tight tracking-tight">
            Year by year,
            <br />
            your money takes <span className="italic">two paths.</span>
          </h2>
          <p className="act2-intro mt-6 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Scroll slowly. Watch the solid emerald SIP line chase the dashed
            amber Lump Sum. Each horizontal line is a milestone your wealth
            crosses — first ₹1L, first ₹10L, the crorepati moment.
          </p>
        </div>
      </section>

      {/* The pinned chart — 4 viewports of scroll */}
      <WealthChart
        timeline={timeline}
        showReal={showReal}
        scrollHeight={chartScrollHeight}
      />

      {/* transition outro */}
      <section
        id="act2-outro"
        className="act-section relative min-h-[40svh] flex flex-col items-center justify-center px-5 sm:px-8 py-16"
      >
        <div className="w-full max-w-2xl mx-auto text-center">
          <p className="font-display text-[clamp(1.4rem,3.5vw,2.2rem)] italic text-muted-foreground leading-snug">
            And then — somewhere along the way —
            <br />
            one of them pulls ahead.
          </p>
        </div>
      </section>
    </>
  );
}
