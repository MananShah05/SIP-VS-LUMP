"use client";

import { useRef } from "react";
import { useCalc } from "@/hooks/sip/useCalc";
import { useGsapRegister } from "@/hooks/sip/useScrollTrigger";
import { formatINR, formatINRCompact } from "@/lib/formatters";
import { AnimatedNumber } from "./ui/AnimatedNumber";
import { Droplets, Banknote, Repeat, CalendarClock } from "lucide-react";

/**
 * Section 2 — The Bet.
 * Two premium cards (SIP vs Lump) with a clean Lucide-icon-based
 * explainer graphic each:
 *  - SIP card: a monthly-repeat pattern (Droplets icon + Repeat badge)
 *    next to a clean upward growth sparkline
 *  - Lump card: a single Banknote icon (one-time) next to a steeper
 *    growth sparkline
 * Cards slide in from opposite sides. Tone: "Same destination,
 * different starting points."
 */
export function Act1_Setup() {
  const { inputs } = useCalc();
  const ref = useRef<HTMLElement | null>(null);

  useGsapRegister(
    ref,
    (gsap) => {
      const cards = gsap.utils.toArray<HTMLElement>(".act1-card");
      if (!cards.length) return;

      gsap.from(cards[0], {
        x: -80,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });
      gsap.from(cards[1], {
        x: 80,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });
      gsap.from(".act1-headline", {
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

      // Subtle fade-up for the explainer strip on each card
      gsap.from(".explainer-strip", {
        y: 18,
        opacity: 0,
        duration: 0.9,
        delay: 0.25,
        ease: "power4.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 60%",
          toggleActions: "play none none reverse",
        },
      });
    },
    [inputs.monthlyAmount, inputs.lumpAmount, inputs.years]
  );

  const totalSipInvested = inputs.monthlyAmount * 12 * inputs.years;
  const totalLumpInvested = inputs.lumpAmount;

  return (
    <section
      ref={ref}
      id="act1"
      className="act-section relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-8 py-20 sm:py-24"
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-4">
            Section 2 — The Bet
          </div>
          <h2 className="act1-headline font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
            Same destination.
            <br />
            <span className="italic text-muted-foreground">
              Different starting points.
            </span>
          </h2>
          <p className="mt-5 max-w-lg mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            You'll commit{" "}
            <span className="text-foreground font-mono-num">
              {formatINRCompact(totalSipInvested)}
            </span>{" "}
            either way. The question is <em>when</em> it goes in.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
          {/* ===== SIP card ===== */}
          <div className="act1-card glass-panel rounded-3xl p-7 sm:p-9 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(72% 0.18 145 / 0.16), transparent 70%)",
              }}
            />
            <div className="flex items-center gap-2 mb-6">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--sip)" }}
              />
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num">
                SIP — every month
              </span>
            </div>

            {/* SIP explainer strip: icon + repeat badge + sparkline */}
            <SipExplainerStrip />

            <div className="mt-6 mb-6">
              <div className="text-xs text-muted-foreground mb-1">Monthly</div>
              <div className="font-mono-num text-2xl sm:text-3xl text-foreground">
                {formatINR(inputs.monthlyAmount)}
              </div>
            </div>

            <div className="hairline mb-6" />

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Total invested over {inputs.years} years
              </div>
              <div
                className="font-display text-[clamp(2.5rem,7vw,4rem)] leading-none"
                style={{ color: "var(--sip)" }}
              >
                <AnimatedNumber
                  value={totalSipInvested}
                  format={formatINRCompact}
                  duration={1.6}
                />
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 font-mono-num">
                {inputs.monthlyAmount.toLocaleString("en-IN")} × 12 ×{" "}
                {inputs.years} yrs
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground/90 leading-relaxed">
              Spread across {inputs.years * 12} monthly contributions. Some buy
              high, some buy low — averaged out. <em>SIP rewards consistency.</em>
            </p>
          </div>

          {/* ===== Lump card ===== */}
          <div className="act1-card glass-panel rounded-3xl p-7 sm:p-9 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(72% 0.20 55 / 0.16), transparent 70%)",
              }}
            />
            <div className="flex items-center gap-2 mb-6">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--lump)" }}
              />
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num">
                Lump — all at once
              </span>
            </div>

            {/* Lump explainer strip: icon + one-time badge + steeper sparkline */}
            <LumpExplainerStrip />

            <div className="mt-6 mb-6">
              <div className="text-xs text-muted-foreground mb-1">
                Day one deposit
              </div>
              <div className="font-mono-num text-2xl sm:text-3xl text-foreground">
                {formatINR(inputs.lumpAmount)}
              </div>
            </div>

            <div className="hairline mb-6" />

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Total invested (one cheque)
              </div>
              <div
                className="font-display text-[clamp(2.5rem,7vw,4rem)] leading-none"
                style={{ color: "var(--lump)" }}
              >
                <AnimatedNumber
                  value={totalLumpInvested}
                  format={formatINRCompact}
                  duration={1.6}
                />
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 font-mono-num">
                paid on day 1, never again
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground/90 leading-relaxed">
              Goes to work immediately. Every rupee compounds for the full{" "}
              {inputs.years} years. <em>Lump Sum rewards capital.</em>
            </p>
          </div>
        </div>

        <div className="text-center mt-12 sm:mt-16">
          <p className="font-display text-lg sm:text-xl italic text-muted-foreground max-w-md mx-auto">
            Scroll. Watch the next {inputs.years} years unfold.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================
 * Explainer strips — clean, icon-led, no weird floating text
 * =========================================================== */

function SipExplainerStrip() {
  return (
    <div className="explainer-strip flex items-center gap-4 p-4 rounded-2xl bg-[oklch(18%_0.012_260_/_0.6)] border border-[oklch(72%_0.18_145_/_0.18)]">
      {/* Icon cluster — droplets, with a small "repeats" badge */}
      <div className="relative shrink-0">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--sip-soft)" }}
        >
          <Droplets
            className="w-6 h-6"
            style={{ color: "var(--sip)" }}
            strokeWidth={1.75}
          />
        </div>
        <span
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2"
          style={{
            background: "oklch(18% 0.012 260)",
            borderColor: "oklch(72% 0.18 145 / 0.5)",
          }}
          title="Repeats monthly"
        >
          <Repeat
            className="w-3 h-3"
            style={{ color: "var(--sip)" }}
            strokeWidth={2.5}
          />
        </span>
      </div>

      {/* Caption */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mb-0.5">
          Pattern
        </div>
        <div className="text-sm text-foreground leading-tight">
          Monthly droplets · accumulates
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <CalendarClock className="w-3 h-3" />
          Every 30 days
        </div>
      </div>

      {/* Sparkline — gradual upward curve (SIP grows slower at first) */}
      <svg
        viewBox="0 0 80 36"
        className="w-20 h-10 shrink-0"
        aria-hidden
        preserveAspectRatio="none"
      >
        <path
          d="M 2 32 Q 20 30 40 22 T 78 6"
          fill="none"
          stroke="var(--sip)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx="78" cy="6" r="2.5" fill="var(--sip)" />
      </svg>
    </div>
  );
}

function LumpExplainerStrip() {
  return (
    <div className="explainer-strip flex items-center gap-4 p-4 rounded-2xl bg-[oklch(18%_0.012_260_/_0.6)] border border-[oklch(72%_0.20_55_/_0.18)]">
      {/* Icon cluster — single banknote, with a "one-time" badge */}
      <div className="relative shrink-0">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--lump-soft)" }}
        >
          <Banknote
            className="w-6 h-6"
            style={{ color: "var(--lump)" }}
            strokeWidth={1.75}
          />
        </div>
        <span
          className="absolute -bottom-1 -right-1 px-1.5 h-5 rounded-full flex items-center justify-center border text-[9px] font-mono-num font-bold"
          style={{
            background: "oklch(18% 0.012 260)",
            borderColor: "oklch(72% 0.20 55 / 0.5)",
            color: "var(--lump)",
          }}
          title="One-time only"
        >
          1×
        </span>
      </div>

      {/* Caption */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mb-0.5">
          Pattern
        </div>
        <div className="text-sm text-foreground leading-tight">
          One-time block · compounds
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <CalendarClock className="w-3 h-3" />
          Day 1, never again
        </div>
      </div>

      {/* Sparkline — steeper upward curve (Lump starts compounding immediately) */}
      <svg
        viewBox="0 0 80 36"
        className="w-20 h-10 shrink-0"
        aria-hidden
        preserveAspectRatio="none"
      >
        <path
          d="M 2 32 Q 18 24 38 16 T 78 2"
          fill="none"
          stroke="var(--lump)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="4 3"
        />
        <circle cx="78" cy="2" r="2.5" fill="var(--lump)" />
      </svg>
    </div>
  );
}
