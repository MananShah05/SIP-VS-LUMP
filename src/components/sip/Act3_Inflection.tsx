"use client";

import { useRef } from "react";
import { useCalc } from "@/hooks/sip/useCalc";
import { useGsapRegister } from "@/hooks/sip/useScrollTrigger";
import { formatINRCompact, formatPct } from "@/lib/formatters";
import { rewardsFraming } from "@/lib/milestones";

/**
 * Section 5 — The Inflection.
 *
 * If a crossover exists: zoom into the crossover point, big year
 * number, word-by-word copy ("Discipline quietly overtakes timing").
 *
 * If Lump always stays ahead: render a side-by-side capital-vs-
 * consistency explainer instead of pretending SIP won. Honest tone.
 */
export function Act3_Inflection() {
  const { crossover, final, inputs } = useCalc();
  const ref = useRef<HTMLElement | null>(null);

  useGsapRegister(ref, (gsap) => {
    gsap.from(".act3-eyebrow", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 65%",
        toggleActions: "play none none reverse",
      },
    });
    gsap.from(".act3-big", {
      scale: 0.92,
      opacity: 0,
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 60%",
        toggleActions: "play none none reverse",
      },
    });
    gsap.from(".act3-body", {
      y: 24,
      opacity: 0,
      duration: 1,
      delay: 0.2,
      ease: "power4.out",
      stagger: 0.15,
      scrollTrigger: {
        trigger: ref.current,
        start: "top 55%",
        toggleActions: "play none none reverse",
      },
    });
  });

  const sipWins = final.sipValue > final.lumpValue;
  const diffAbs = Math.abs(final.sipValue - final.lumpValue);
  const diffPct = diffAbs / Math.min(final.sipValue, final.lumpValue);

  return (
    <section
      ref={ref}
      id="act3"
      className="act-section relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-8 py-20 sm:py-24"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: crossover
            ? "radial-gradient(ellipse 60% 50% at 50% 40%, oklch(72% 0.18 145 / 0.10), transparent 70%)"
            : "radial-gradient(ellipse 60% 50% at 50% 40%, oklch(72% 0.20 55 / 0.08), transparent 70%)",
        }}
      />

      <div className="w-full max-w-3xl mx-auto text-center">
        <div className="act3-eyebrow text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-6">
          Section 5 — The Inflection
        </div>

        {crossover ? (
          <>
            {/* Crossover case: zoom into crossover point */}
            <div className="act3-big">
              <div
                className="font-display text-[clamp(5rem,18vw,11rem)] leading-none tracking-tight"
                style={{ color: "var(--sip)" }}
              >
                Year {crossover.year}
              </div>
            </div>
            <h3 className="act3-body font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight mt-6 text-foreground">
              That's when your SIP caught up.
            </h3>
            <p className="act3-body mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              In year {crossover.year}, your monthly SIP overtook the lump sum
              you could have made on day one. Discipline quietly overtook
              timing — and kept winning for the remaining{" "}
              {inputs.years - crossover.year} years.
            </p>

            {/* Crossover visualisation */}
            <div className="act3-body mt-10 inline-flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/60 bg-[var(--surface)]/40">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num">
                  SIP @ Y{crossover.year}
                </div>
                <div
                  className="font-mono-num text-lg"
                  style={{ color: "var(--sip)" }}
                >
                  {formatINRCompact(crossover.sipValue)}
                </div>
              </div>
              <div className="text-2xl text-muted-foreground">≈</div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num">
                  Lump @ Y{crossover.year}
                </div>
                <div
                  className="font-mono-num text-lg"
                  style={{ color: "var(--lump)" }}
                >
                  {formatINRCompact(crossover.lumpValue)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Lump always ahead: side-by-side capital vs consistency explainer */}
            <div className="act3-big">
              <div
                className="font-display text-[clamp(3.5rem,12vw,7rem)] leading-none tracking-tight"
                style={{ color: "var(--lump)" }}
              >
                Lump won
                <br />
                <span className="italic text-foreground/80">the spreadsheet.</span>
              </div>
            </div>

            <h3 className="act3-body font-display text-[clamp(1.4rem,3.5vw,2.2rem)] leading-tight mt-6 text-foreground">
              But SIP asks a more realistic question:
              <br />
              <span className="italic text-muted-foreground">
                could you invest it all on day one?
              </span>
            </h3>

            {/* Capital vs consistency explainer */}
            <div className="act3-body mt-10 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="glass-panel rounded-2xl p-5 text-left border-l-2" style={{ borderLeftColor: "var(--lump)" }}>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num mb-2">
                  Lump Sum path
                </div>
                <div className="font-display text-xl text-foreground mb-2">
                  Rewards capital.
                </div>
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  You needed {formatINRCompact(inputs.lumpAmount)} today, all at
                  once. Most salaried earners don't have it. The math rewards
                  those who do.
                </p>
                <div className="mt-3 font-mono-num text-xs text-muted-foreground">
                  Final: {formatINRCompact(final.lumpValue)} ·{" "}
                  {formatPct(diffPct, 0)} ahead
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 text-left border-l-2" style={{ borderLeftColor: "var(--sip)" }}>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num mb-2">
                  SIP path
                </div>
                <div className="font-display text-xl text-foreground mb-2">
                  Rewards consistency.
                </div>
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  You only needed {formatINRCompact(inputs.monthlyAmount)}/mo.
                  The math rewards the discipline of showing up every month —
                  without needing all the money upfront.
                </p>
                <div className="mt-3 font-mono-num text-xs text-muted-foreground">
                  Final: {formatINRCompact(final.sipValue)}
                </div>
              </div>
            </div>

            <p className="act3-body mt-10 font-display text-lg sm:text-xl italic text-foreground/80 max-w-xl mx-auto">
              "{rewardsFraming()}"
            </p>
          </>
        )}
      </div>
    </section>
  );
}
