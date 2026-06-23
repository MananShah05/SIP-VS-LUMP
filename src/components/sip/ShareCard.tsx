"use client";

import { useEffect, useRef, useState } from "react";
import { useCalc } from "@/hooks/sip/useCalc";
import { useGsapRegister } from "@/hooks/sip/useScrollTrigger";
import { formatINRCompact, formatPct } from "@/lib/formatters";
import { verdictLine } from "@/lib/milestones";
import { cn } from "@/lib/utils";

/**
 * ShareCard — final viewport.
 * Visual result card with copy-tweet and native share buttons.
 */
export function ShareCard() {
  const { final, inputs } = useCalc();
  const [copied, setCopied] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const ref = useRef<HTMLElement | null>(null);

  // Re-read window.location.href whenever the calc result changes
  // (which happens whenever the user changes any input). The
  // setState call is inside a rAF callback so it's not synchronous
  // in the effect body — avoids the cascading-render lint rule.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = requestAnimationFrame(() => {
      setShareURL(window.location.href);
    });
    return () => cancelAnimationFrame(id);
  }, [final, inputs]);

  useGsapRegister(ref, (gsap) => {
    gsap.from(".share-eyebrow", {
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
    gsap.from(".share-card", {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 65%",
        toggleActions: "play none none reverse",
      },
    });
    gsap.from(".share-actions", {
      y: 24,
      opacity: 0,
      duration: 0.9,
      delay: 0.2,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 60%",
        toggleActions: "play none none reverse",
      },
    });
  });

  const verdict = verdictLine(final.sipValue, final.lumpValue, inputs.years);

  const tweetText = `I ran the SIP vs Lump Sum math.

₹${inputs.monthlyAmount.toLocaleString("en-IN")}/mo × ${inputs.years} years @ ${formatPct(
    inputs.annualReturn,
    0
  )}

SIP → ${formatINRCompact(final.sipValue)}
Lump → ${formatINRCompact(final.lumpValue)}

${verdict}

Run yours → ${shareURL}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tweetText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = tweetText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareURL
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SIP vs Lump Sum",
          text: tweetText,
          url: shareURL,
        });
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <section
      ref={ref}
      id="share"
      className="act-section relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-8 py-20 sm:py-24"
    >
      <div className="w-full max-w-2xl mx-auto">
        <div className="share-eyebrow text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono-num mb-3">
          Section 7 — Share Card
        </div>
        <h2 className="share-eyebrow font-display text-[clamp(1.8rem,4.5vw,2.8rem)] leading-tight text-center mb-10 sm:mb-12">
          Take it with you.
        </h2>

        {/* The card */}
        <div className="share-card glass-panel rounded-3xl p-7 sm:p-9 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(72% 0.18 145 / 0.18), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full"
            style={{
              background:
                "radial-gradient(circle, oklch(72% 0.20 55 / 0.18), transparent 70%)",
            }}
          />

          {/* Inputs row */}
          <div className="relative grid grid-cols-3 gap-3 sm:gap-4 mb-7 pb-7 border-b border-border/40">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mb-1">
                Monthly
              </div>
              <div className="font-mono-num text-base sm:text-lg text-foreground">
                {formatINRCompact(inputs.monthlyAmount)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mb-1">
                Return
              </div>
              <div className="font-mono-num text-base sm:text-lg text-foreground">
                {formatPct(inputs.annualReturn, 0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mb-1">
                Horizon
              </div>
              <div className="font-mono-num text-base sm:text-lg text-foreground">
                {inputs.years}y
              </div>
            </div>
          </div>

          {/* SIP vs Lump bar */}
          <div className="relative mb-7">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
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
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num">
                    SIP
                  </span>
                </div>
                <div
                  className="font-display text-3xl sm:text-4xl"
                  style={{ color: "var(--sip)" }}
                >
                  {formatINRCompact(final.sipValue)}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num">
                    Lump
                  </span>
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
                </div>
                <div
                  className="font-display text-3xl sm:text-4xl"
                  style={{ color: "var(--lump)" }}
                >
                  {formatINRCompact(final.lumpValue)}
                </div>
              </div>
            </div>
            <SplitBar
              sipValue={final.sipValue}
              lumpValue={final.lumpValue}
            />
          </div>

          {/* Verdict */}
          <div className="relative px-5 py-4 rounded-2xl bg-[oklch(22%_0.014_260_/_0.7)] border border-border/40 text-center mb-7">
            <p className="font-display text-base sm:text-lg italic text-foreground leading-snug">
              "{verdict}"
            </p>
          </div>

          {/* URL preview */}
          <div className="relative flex items-center gap-2 px-4 py-3 rounded-xl bg-[oklch(12%_0.01_260_/_0.7)] border border-border/40 mb-7">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num">
              URL
            </span>
            <span className="font-mono-num text-xs text-muted-foreground/80 truncate flex-1">
              {shareURL || "loading..."}
            </span>
          </div>

          {/* Actions */}
          <div className="share-actions relative grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={handleCopy}
              className={cn(
                "px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all",
                "border border-border/60 hover:border-[var(--sip)]/60",
                "hover:bg-[oklch(72%_0.18_145_/_0.08)]",
                copied ? "text-[var(--sip)] border-[var(--sip)]" : "text-foreground"
              )}
            >
              {copied ? "Copied ✓" : "Copy tweet"}
            </button>
            <button
              onClick={handleTwitter}
              className="px-4 py-3 rounded-xl text-xs sm:text-sm font-medium border border-border/60 hover:border-[var(--sip)]/60 hover:bg-[oklch(72%_0.18_145_/_0.08)] transition-all text-foreground"
            >
              Post on X
            </button>
            <button
              onClick={handleLinkedIn}
              className="px-4 py-3 rounded-xl text-xs sm:text-sm font-medium border border-border/60 hover:border-[var(--lump)]/60 hover:bg-[oklch(72%_0.20_55_/_0.08)] transition-all text-foreground"
            >
              LinkedIn
            </button>
            <button
              onClick={handleNative}
              className="px-4 py-3 rounded-xl text-xs sm:text-sm font-medium bg-[var(--sip)] text-[oklch(12%_0.01_260)] hover:bg-[oklch(78%_0.18_145)] transition-colors"
            >
              Share…
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="share-actions text-center text-[11px] text-muted-foreground/70 mt-8 font-mono-num max-w-md mx-auto leading-relaxed">
          Not financial advice. Past performance is not a predictor. This is a
          math-driven narrative — consult a SEBI-registered advisor before
          investing.
        </p>
      </div>
    </section>
  );
}

function SplitBar({
  sipValue,
  lumpValue,
}: {
  sipValue: number;
  lumpValue: number;
}) {
  const total = sipValue + lumpValue;
  const sipPct = total > 0 ? (sipValue / total) * 100 : 50;
  const lumpPct = 100 - sipPct;

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-[oklch(22%_0.014_260)]">
      <div
        style={{ width: `${sipPct}%`, background: "var(--sip)" }}
        className="transition-all duration-700"
      />
      <div
        style={{ width: `${lumpPct}%`, background: "var(--lump)" }}
        className="transition-all duration-700"
      />
    </div>
  );
}
