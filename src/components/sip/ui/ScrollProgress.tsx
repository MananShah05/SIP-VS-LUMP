"use client";

import { useEffect, useState } from "react";

/**
 * ScrollProgress — thin top progress bar.
 * Tracks overall page scroll progress (0 → 1).
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none">
      <div
        className="h-full origin-left"
        style={{
          width: `${progress * 100}%`,
          background:
            "linear-gradient(90deg, var(--sip), var(--lump))",
          transition: "width 0.05s linear",
        }}
      />
    </div>
  );
}
