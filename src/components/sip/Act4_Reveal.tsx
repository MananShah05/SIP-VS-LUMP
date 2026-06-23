"use client";

import { useRef } from "react";
import { useCalc } from "@/hooks/sip/useCalc";
import { useInputs } from "@/store/inputs";
import { useGsapRegister } from "@/hooks/sip/useScrollTrigger";
import { formatINR, formatINRCompact, formatPct } from "@/lib/formatters";
import { topMilestoneFor, verdictLine, rewardsFraming } from "@/lib/milestones";
import { AnimatedNumber } from "./ui/AnimatedNumber";

/**
 * Section 6 — Final Reveal.
 *
 * Two premium result cards (SIP / Lump) with:
 *  - Final wealth (nominal)
 *  - Inflation-adjusted "ghost" value displayed muted underneath
 *  - Total invested, gain, effective CAGR
 *  - Best milestone crossed
 *  - Verdict line based on who actually won
 */
export function Act4_Reveal() {
  const { final, sipCAGR, lumpCAGR, inputs } = useCalc();
  const showReal = useInputs((s) => s.showReal);
  const setShowReal = useInputs((s) => s.setShowReal);
  const ref = useRef<HTMLElement | null>(null);

  useGsapRegister(ref, (gsap) => {
    gsap.from(".act4-eyebrow", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
    });
    gsap.from(".act4-card", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
      stagger: 0.15,
      scrollTrigger: {
        trigger: ref.current,
        start: "top 65%",
        toggleActions: "play none none reverse",
      },
    });
    gsap.from(".act4-verdict", {
      scale: 0.96,
      opacity: 0,
      duration: 1.2,
      delay: 0.4,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 55%",
        toggleActions: "play none none reverse",
      },
    });
  });

  const sipFinal = showReal ? final.sipReal : final.sipValue;
  const lumpFinal = showReal ? final.lumpReal : final.lumpValue;
  const sipMilestone = topMilestoneFor(final.sipValue);
  const lumpMilestone = topMilestoneFor(final.lumpValue);
  const verdict = verdictLine(final.sipValue, final.lumpValue, inputs.years);
  const sipWins = final.sipValue > final.lumpValue;

  return (
    <section
      ref={ref}
      id="act4"
      className="act-section relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-8 py-20 sm:py-24"
    >
      <div className="w-full max-w-4xl mx-auto">
        <div className="act4-eyebrow text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-3">
          Section 6 — Final Reveal
        </div>
        <h2 className="act4-eyebrow font-display text-[clamp(1.8rem,4.5vw,3rem)] leading-tight text-center mb-3">
          After {inputs.years} years, here's where you stand.
        </h2>
        <p className="act4-eyebrow text-center text-sm text-muted-foreground mb-8 italic">
          {rewardsFraming()}
        </p>

        {/* Inflation toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-full border border-border/60 bg-[var(--surface)]/50">
            <button
              onClick={() => setShowReal(false)}
              className={`px-4 py-1.5 text-xs sm:text-sm rounded-full font-mono-num transition-colors ${
                !showReal
                  ? "bg-[var(--surface-elevated)] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nominal
            </button>
            <button
              onClick={() => setShowReal(true)}
              className={`px-4 py-1.5 text-xs sm:text-sm rounded-full font-mono-num transition-colors ${
                showReal
                  ? "bg-[var(--surface-elevated)] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inflation-adjusted
            </button>
          </div>
        </div>

        {/* Two-column final numbers */}
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          {/* SIP card */}
          <div className="act4-card glass-panel rounded-3xl p-7 sm:p-8 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(72% 0.18 145 / 0.18), transparent 70%)",
              }}
            />
            <div className="flex items-center gap-2 mb-6">
              <svg width="22" height="6">
                <line
                  x1="0"
                  y1="3"
                  x2="22"
                  y2="3"
                  stroke="var(--sip)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num">
                SIP — Final
              </span>
            </div>

            {/* Nominal value */}
            <div
              className="font-display text-[clamp(2.8rem,9vw,5rem)] leading-none"
              style={{ color: "var(--sip)" }}
            >
              <AnimatedNumber
                value={sipFinal}
                format={formatINRCompact}
                duration={2}
              />
            </div>

            {/* Inflation ghost value — muted, displayed under nominal */}
            {!showReal && (
              <div className="mt-2 font-mono-num text-sm text-muted-foreground/60 line-through decoration-muted-foreground/40">
                {formatINRCompact(final.sipReal)}{" "}
                <span className="text-[10px] uppercase tracking-[0.14em] no-underline">
                  in today's ₹
                </span>
              </div>
            )}
            {/* When viewing real, show nominal as ghost instead */}
            {showReal && (
              <div className="mt-2 font-mono-num text-sm text-muted-foreground/60">
                {formatINRCompact(final.sipValue)}{" "}
                <span className="text-[10px] uppercase tracking-[0.14em]">
                  nominal
                </span>
              </div>
            )}

            <div className="hairline my-6" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Invested
                </div>
                <div className="font-mono-num text-foreground">
                  {formatINRCompact(final.sipInvested)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Gains
                </div>
                <div className="font-mono-num" style={{ color: "var(--sip)" }}>
                  +{formatINRCompact(final.sipGain)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Annualized return
                </div>
                <div className="font-mono-num text-foreground">
                  {formatPct(sipCAGR)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Real value
                </div>
                <div className="font-mono-num text-muted-foreground">
                  {formatINRCompact(final.sipReal)}
                </div>
              </div>
            </div>
            {sipMilestone && (
              <div className="mt-6 px-4 py-2 rounded-full bg-[oklch(72%_0.18_145_/_0.1)] border border-[oklch(72%_0.18_145_/_0.3)] text-center">
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mr-2">
                  Milestone
                </span>
                <span className="text-sm" style={{ color: "var(--sip)" }}>
                  {sipMilestone.label}
                </span>
              </div>
            )}
          </div>

          {/* Lump card */}
          <div className="act4-card glass-panel rounded-3xl p-7 sm:p-8 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(72% 0.20 55 / 0.18), transparent 70%)",
              }}
            />
            <div className="flex items-center gap-2 mb-6">
              <svg width="22" height="6">
                <line
                  x1="0"
                  y1="3"
                  x2="22"
                  y2="3"
                  stroke="var(--lump)"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num">
                Lump — Final
              </span>
            </div>

            <div
              className="font-display text-[clamp(2.8rem,9vw,5rem)] leading-none"
              style={{ color: "var(--lump)" }}
            >
              <AnimatedNumber
                value={lumpFinal}
                format={formatINRCompact}
                duration={2}
              />
            </div>

            {!showReal && (
              <div className="mt-2 font-mono-num text-sm text-muted-foreground/60 line-through decoration-muted-foreground/40">
                {formatINRCompact(final.lumpReal)}{" "}
                <span className="text-[10px] uppercase tracking-[0.14em] no-underline">
                  in today's ₹
                </span>
              </div>
            )}
            {showReal && (
              <div className="mt-2 font-mono-num text-sm text-muted-foreground/60">
                {formatINRCompact(final.lumpValue)}{" "}
                <span className="text-[10px] uppercase tracking-[0.14em]">
                  nominal
                </span>
              </div>
            )}

            <div className="hairline my-6" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Invested
                </div>
                <div className="font-mono-num text-foreground">
                  {formatINRCompact(final.lumpInvested)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Gains
                </div>
                <div className="font-mono-num" style={{ color: "var(--lump)" }}>
                  +{formatINRCompact(final.lumpGain)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Annualized return
                </div>
                <div className="font-mono-num text-foreground">
                  {formatPct(lumpCAGR)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1 font-mono-num">
                  Real value
                </div>
                <div className="font-mono-num text-muted-foreground">
                  {formatINRCompact(final.lumpReal)}
                </div>
              </div>
            </div>
            {lumpMilestone && (
              <div className="mt-6 px-4 py-2 rounded-full bg-[oklch(72%_0.20_55_/_0.1)] border border-[oklch(72%_0.20_55_/_0.3)] text-center">
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mr-2">
                  Milestone
                </span>
                <span className="text-sm" style={{ color: "var(--lump)" }}>
                  {lumpMilestone.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Verdict */}
        <div className="act4-verdict mt-10 sm:mt-14 text-center">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-3">
            Verdict
          </div>
          <p className="font-display text-[clamp(1.4rem,3.2vw,2rem)] leading-snug text-foreground italic max-w-2xl mx-auto">
            "{verdict}"
          </p>
          <p className="mt-4 text-xs text-muted-foreground font-mono-num">
            {sipWins ? "SIP created wealth through consistency." : "Lump Sum had more time in the market."}{" "}
            {sipWins ? "Without needing all the money upfront." : "SIP asked a more realistic question."}
          </p>
        </div>
      </div>
    </section>
  );
}
