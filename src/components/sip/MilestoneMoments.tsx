"use client";

import { useRef } from "react";
import { useCalc } from "@/hooks/sip/useCalc";
import { useGsapRegister } from "@/hooks/sip/useScrollTrigger";
import { groupMilestonesByYear, type MilestoneGroup } from "@/lib/milestones";
import { formatINRCompact } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, Home, Wallet, Trophy, Plane, ShieldCheck } from "lucide-react";

/**
 * Section 4 — Milestone Moments.
 *
 * Renders a proper *timeline*: each year that crosses at least one
 * milestone appears exactly once as a node, with every milestone
 * crossed that year listed under it. No duplicate year labels.
 *
 * Visual: a vertical timeline rail down the middle (desktop) /
 * left side (mobile), with each year as a node and milestone chips
 * branching off.
 */
export function MilestoneMoments() {
  const { timeline, inputs } = useCalc();
  const ref = useRef<HTMLElement | null>(null);

  // Group milestones by the year each is first reached
  const groups = groupMilestonesByYear(timeline, "sip");

  useGsapRegister(ref, (gsap) => {
    const nodes = gsap.utils.toArray<HTMLElement>(".mm-node");
    if (!nodes.length) return;

    nodes.forEach((node) => {
      gsap.fromTo(
        node,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: node,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    gsap.from(".mm-eyebrow", {
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
  });

  if (groups.length === 0) {
    return (
      <section
        ref={ref}
        id="milestones"
        className="act-section relative min-h-[60svh] flex flex-col items-center justify-center px-5 sm:px-8 py-16"
      >
        <div className="text-center max-w-md">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-4">
            Section 4 — Milestone Moments
          </div>
          <h3 className="font-display text-2xl sm:text-3xl leading-tight text-foreground">
            Your horizon doesn't reach ₹1L yet.
          </h3>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Try a longer duration or a higher monthly amount to see your wealth
            cross emotional milestones.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      id="milestones"
      className="act-section relative py-20 sm:py-24 px-5 sm:px-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="mm-eyebrow text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-4">
            Section 4 — Milestone Moments
          </div>
          <h2 className="mm-eyebrow font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">
            Numbers become
            <br />
            <span className="italic text-muted-foreground">moments.</span>
          </h2>
          <p className="mm-eyebrow mt-5 max-w-lg mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Each SIP threshold your wealth crosses is a story. Here are the
            moments you'll hit on your {inputs.years}-year path, grouped by
            the year they happen.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical rail — left on mobile, centered on desktop */}
          <div
            aria-hidden
            className="absolute top-2 bottom-2 w-px left-4 sm:left-1/2 sm:-translate-x-1/2"
            style={{
              background:
                "linear-gradient(to bottom, transparent, oklch(72% 0.18 145 / 0.3) 10%, oklch(72% 0.18 145 / 0.3) 90%, transparent)",
            }}
          />

          <div className="space-y-8 sm:space-y-12">
            {groups.map((g, i) => (
              <TimelineNode key={g.year} group={g} index={i} />
            ))}
          </div>
        </div>

        <div className="hairline mt-16" />
        <p className="mt-6 text-center text-xs text-muted-foreground/80 italic max-w-md mx-auto">
          Milestones follow the SIP path so the timeline stays tied to your
          monthly-input story. Years are approximate.
        </p>
      </div>
    </section>
  );
}

/* ===========================================================
 * TimelineNode — one entry per year, with all milestones that
 * were crossed during that year grouped inside it.
 * =========================================================== */

function TimelineNode({ group, index }: { group: MilestoneGroup; index: number }) {
  const isLeft = index % 2 === 0; // alternate sides on desktop
  const { year, milestones } = group;

  return (
    <div className="mm-node relative pl-12 sm:pl-0">
      {/* Year dot on the rail */}
      <div
        className="absolute top-1 left-4 sm:left-1/2 sm:-translate-x-1/2 z-10"
        aria-hidden
      >
        <span
          className="block w-3 h-3 rounded-full ring-4"
          style={{
            background: "var(--sip)",
            // ring color matches the page background
            boxShadow: "0 0 0 4px oklch(12% 0.01 260)",
          }}
        />
      </div>

      {/* Card — alternating left/right on desktop, always full width on mobile */}
      <div
        className={cn(
          "sm:w-[calc(50%-2rem)]",
          isLeft ? "sm:mr-auto sm:pr-8 sm:text-right" : "sm:ml-auto sm:pl-8"
        )}
      >
        <div className="glass-panel rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-10 -right-10 w-28 h-28 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(72% 0.18 145 / 0.12), transparent 70%)",
            }}
          />

          {/* Year header — appears exactly once per year */}
          <div
            className={cn(
              "flex items-baseline gap-3 mb-4",
              isLeft ? "sm:justify-end" : "sm:justify-start"
            )}
          >
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono-num">
              Year
            </span>
            <span
              className="font-display text-4xl sm:text-5xl leading-none"
              style={{ color: "var(--sip)" }}
            >
              {year}
            </span>
          </div>

          {/* Milestones crossed this year */}
          <div
            className={cn(
              "space-y-3",
              isLeft ? "sm:items-end" : "sm:items-start"
            )}
          >
            {milestones.map((m) => (
              <div
                key={m.value}
                className={cn(
                  "flex items-start gap-3",
                  isLeft ? "sm:flex-row-reverse sm:text-right" : ""
                )}
              >
                <MilestoneIcon label={m.label} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className="font-mono-num text-lg sm:text-xl"
                      style={{ color: "var(--sip)" }}
                    >
                      {formatINRCompact(m.value)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num">
                      {m.tag}
                    </span>
                  </div>
                  <div className="font-display text-base sm:text-lg text-foreground leading-tight mt-0.5">
                    {m.label}
                  </div>
                  {m.moment && (
                    <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed italic mt-1">
                      {m.moment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
 * MilestoneIcon — Lucide icon chosen by milestone tag, so each
 * milestone reads visually distinct without custom SVG art.
 * =========================================================== */

function MilestoneIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  let Icon = Sparkles;
  if (l.includes("emergency") || l.includes("retirement")) Icon = ShieldCheck;
  else if (l.includes("down payment") || l.includes("1bhk") || l.includes("3bhk")) Icon = Home;
  else if (l.includes("crorepati") || l.includes("wealth engine")) Icon = Trophy;
  else if (l.includes("europe") || l.includes("trip") || l.includes("phone")) Icon = Plane;
  else if (l.includes("10l") || l.includes("1l") || l.includes("first")) Icon = TrendingUp;
  else Icon = Wallet;

  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
      style={{ background: "var(--sip-soft)" }}
    >
      <Icon
        className="w-4.5 h-4.5"
        style={{ color: "var(--sip)" }}
        strokeWidth={1.75}
        size={18}
      />
    </div>
  );
}
