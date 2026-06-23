"use client";

import { useEffect, useState } from "react";
import { useInputs } from "@/store/inputs";
import { Hero } from "@/components/sip/Hero";
import { Act1_Setup } from "@/components/sip/Act1_Setup";
import { Act2_Journey } from "@/components/sip/Act2_Journey";
import { MilestoneMoments } from "@/components/sip/MilestoneMoments";
import { Act3_Inflection } from "@/components/sip/Act3_Inflection";
import { Act4_Reveal } from "@/components/sip/Act4_Reveal";
import { ShareCard } from "@/components/sip/ShareCard";
import { ScrollProgress } from "@/components/sip/ui/ScrollProgress";

export default function Home() {
  const hydrateFromURL = useInputs((s) => s.hydrateFromURL);

  useEffect(() => {
    hydrateFromURL();
  }, [hydrateFromURL]);

  const handleHeroSubmit = () => {
    if (typeof document !== "undefined") {
      const el = document.getElementById("act1");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      <ScrollProgress />

      {/* Top-left brand mark */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-40 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--sip)] animate-pulse" />
          <span className="font-mono-num text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            SIP<span className="text-foreground/60">vs</span>Lump
          </span>
        </div>
      </div>

      {/* Top-right edit link — appears after the hero is committed */}
      <EditInputsButton />

      <Hero onSubmit={handleHeroSubmit} />
      <Act1_Setup />
      <Act2_Journey />
      <MilestoneMoments />
      <Act3_Inflection />
      <Act4_Reveal />
      <ShareCard />

      {/* Bottom signature */}
      <footer className="relative py-10 px-5 sm:px-8 text-center border-t border-border/30 mt-10">
        <p className="font-mono-num text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Built in a weekend · Math, not advice
        </p>
        <p className="mt-2 font-display text-sm italic text-muted-foreground/60 max-w-md mx-auto">
          SIPvsLump turns investing math into a cinematic story — showing not
          just which path wins, but what kind of investor each path demands.
        </p>
      </footer>
    </main>
  );
}

/**
 * Floating "Edit inputs" button. Appears after user has scrolled
 * past the hero. Smooth-scrolls back to top.
 */
function EditInputsButton() {
  const [visible, setVisible] = useState(false);
  const committed = useInputs((s) => s.committed);

  useEffect(() => {
    if (!committed) return;
    const onScroll = () => {
      const hero = document.getElementById("hero");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      setVisible(rect.bottom < -50);
    };
    const rafId = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [committed]);

  if (!visible) return null;

  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 px-4 py-2 rounded-full glass-panel text-xs sm:text-sm font-mono-num text-foreground hover:bg-[var(--surface-elevated)] transition-colors"
    >
      ← Edit inputs
    </button>
  );
}
