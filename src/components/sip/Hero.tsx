"use client";

import { useInputs } from "@/store/inputs";
import { fairLumpAmount } from "@/lib/calc";
import { formatINR, formatINRCompact, formatPct } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface HeroProps {
  /** called when user submits the form; parent scrolls to Section 2 */
  onSubmit: () => void;
}

/**
 * Hero — Section 1.
 * Full-screen editorial headline + 4 inputs (monthly, return, years,
 * lump sum with "fair" toggle). Background has an animated wealth
 * curve drawn in SVG.
 */
export function Hero({ onSubmit }: HeroProps) {
  const monthly = useInputs((s) => s.monthlyAmount);
  const lumpAmount = useInputs((s) => s.lumpAmount);
  const annualReturn = useInputs((s) => s.annualReturn);
  const years = useInputs((s) => s.years);
  const setMonthly = useInputs((s) => s.setMonthly);
  const setLump = useInputs((s) => s.setLump);
  const setAnnualReturn = useInputs((s) => s.setAnnualReturn);
  const setYears = useInputs((s) => s.setYears);
  const commit = useInputs((s) => s.commit);

  // "Fair" preset: lump = monthly × 12 × years (matches total SIP principal)
  const fairLump = fairLumpAmount(monthly, years);
  const isFairPreset = Math.abs(lumpAmount - fairLump) < 1;

  const handleSubmit = () => {
    commit();
    onSubmit();
  };

  const handleToggleFair = () => {
    if (!isFairPreset) {
      setLump(fairLump);
    }
  };

  return (
    <section
      id="hero"
      className="act-section relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-8 py-16 sm:py-20 grain overflow-hidden"
    >
      {/* Animated background wealth curve (decorative) */}
      <BackgroundWealthCurve />

      {/* faint background gradient */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(72% 0.18 145 / 0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 90%, oklch(72% 0.20 55 / 0.06), transparent 60%)",
        }}
      />

      <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-8 font-mono-num">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--sip)]" />
          SIP vs Lump Sum
        </div>

        {/* headline */}
        <h1 className="font-display text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.98] tracking-tight max-w-4xl">
          <span className="text-[var(--sip)]">{formatINRCompact(monthly)}</span>
          <span className="text-foreground"> a month.</span>
          <br />
          <span className="text-foreground">{years} years.</span>
          <br />
          <span className="text-foreground/90 italic">
            Two very different stories.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          See how SIP discipline compares with lump sum capital — not as a
          table, but as a story.
        </p>

        {/* inputs */}
        <div className="mt-10 w-full max-w-2xl grid gap-4 sm:gap-5 sm:grid-cols-2 text-left">
          <HeroInput
            label="Monthly SIP"
            value={String(monthly)}
            display={formatINRCompact(monthly)}
            min={500}
            max={200000}
            step={500}
            onChange={(s) => {
              const v = Number(s);
              if (!isNaN(v) && s.trim() !== "") {
                setMonthly(v);
                if (isFairPreset) setLump(fairLumpAmount(v, years));
              }
            }}
          />
          <HeroInput
            label="Expected return"
            value={String(Math.round(annualReturn * 100))}
            display={`${Math.round(annualReturn * 100)}% / yr`}
            min={1}
            max={30}
            step={1}
            onChange={(s) => {
              const v = Number(s);
              if (!isNaN(v) && s.trim() !== "") setAnnualReturn(v / 100);
            }}
          />
          <HeroInput
            label="Time horizon"
            value={String(years)}
            display={`${years} yr${years === 1 ? "" : "s"}`}
            min={1}
            max={40}
            step={1}
            onChange={(s) => {
              const v = Number(s);
              if (!isNaN(v) && s.trim() !== "") {
                const nextYears = Math.floor(v);
                setYears(nextYears);
                if (isFairPreset) setLump(fairLumpAmount(monthly, nextYears));
              }
            }}
          />
          <HeroInput
            label="Lump sum (one-time)"
            value={String(lumpAmount)}
            display={formatINRCompact(lumpAmount)}
            min={1000}
            max={50000000}
            step={10000}
            onChange={(s) => {
              const v = Number(s);
              if (!isNaN(v) && s.trim() !== "") setLump(v);
            }}
            footer={
              <button
                type="button"
                onClick={handleToggleFair}
                className={cn(
                  "mt-2 text-[10px] uppercase tracking-[0.14em] font-mono-num transition-colors",
                  isFairPreset
                    ? "text-[var(--sip)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isFairPreset
                  ? "✓ Matches total SIP principal"
                  : "Match total SIP principal →"}
              </button>
            }
          />
        </div>

        <p className="mt-5 text-[11px] text-muted-foreground/80 font-mono-num max-w-md">
          Fair comparison preset: lump sum = monthly × 12 × years ={" "}
          <span className="text-foreground">
            {formatINR(fairLump)}
          </span>
        </p>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[var(--sip)] text-[oklch(12%_0.01_260)] px-7 py-3.5 text-sm font-medium tracking-tight hover:bg-[oklch(78%_0.18_145)] transition-colors glow-sip"
        >
          See the story
          <span className="inline-block transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>

        <p className="mt-4 text-[11px] text-muted-foreground/70 font-mono-num">
          {formatPct(annualReturn)} CAGR · ₹{monthly.toLocaleString("en-IN")}/mo
          · {years}y · {formatINRCompact(lumpAmount)} lump
        </p>
      </div>
    </section>
  );
}

interface HeroInputProps {
  label: string;
  value: string;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (s: string) => void;
  footer?: React.ReactNode;
}

function HeroInput({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  footer,
}: HeroInputProps) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </label>
        <span className="font-mono-num text-xs text-foreground/80">
          {display}
        </span>
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full bg-transparent border-0 border-b border-border/50",
          "pb-2 mb-3 text-lg font-mono-num text-foreground",
          "focus:outline-none focus:border-[var(--sip)] transition-colors"
        )}
      />
      <input
        type="range"
        value={Number(value) || min}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
      {footer}
    </div>
  );
}

/**
 * Decorative animated background: a faint SVG wealth curve that
 * draws itself once on mount. Pure CSS animation — no JS, no
 * scroll-coupling, just ambient motion.
 */
function BackgroundWealthCurve() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1440 900"
      style={{ opacity: 0.18 }}
    >
      <defs>
        <linearGradient id="bg-curve-sip" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--sip)" stopOpacity="0" />
          <stop offset="60%" stopColor="var(--sip)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--sip)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bg-curve-lump" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--lump)" stopOpacity="0" />
          <stop offset="60%" stopColor="var(--lump)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--lump)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Lump curve — dashed amber */}
      <path
        d="M 0 760 C 300 740, 600 660, 900 480 S 1300 200, 1440 140"
        fill="none"
        stroke="url(#bg-curve-lump)"
        strokeWidth={2}
        strokeDasharray="6 8"
        style={{
          strokeDashoffset: 3000,
          animation: "bg-draw 8s ease-out 0.4s forwards",
        }}
      />
      {/* SIP curve — solid emerald */}
      <path
        d="M 0 800 C 360 790, 720 720, 1080 540 S 1380 280, 1440 240"
        fill="none"
        stroke="url(#bg-curve-sip)"
        strokeWidth={2.5}
        style={{
          strokeDashoffset: 3000,
          strokeDasharray: 3000,
          animation: "bg-draw 7s ease-out 0s forwards",
        }}
      />
      <style>{`
        @keyframes bg-draw {
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-bg-curve] { stroke-dashoffset: 0 !important; animation: none !important; }
        }
      `}</style>
    </svg>
  );
}
