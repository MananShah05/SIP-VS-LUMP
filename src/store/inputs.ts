/**
 * Zustand store — single source of truth for SIP vs Lump inputs.
 * Also handles URL param hydration and updates the URL on change
 * (so the shareable link is always live).
 */

"use client";

import { create } from "zustand";
import { DEFAULT_INPUTS, type CalcInputs } from "@/lib/calc";

interface InputsState extends CalcInputs {
  /** whether the user has explicitly submitted the form (locks inputs into the story) */
  committed: boolean;
  /** show inflation-adjusted values everywhere */
  showReal: boolean;
  /** hydrate from URL params (called once on mount) */
  hydrateFromURL: () => void;
  setMonthly: (v: number) => void;
  setLump: (v: number) => void;
  setAnnualReturn: (v: number) => void;
  setYears: (v: number) => void;
  setShowReal: (v: boolean) => void;
  commit: () => void;
  reset: () => void;
}

const clamped = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const useInputs = create<InputsState>((set, get) => ({
  ...DEFAULT_INPUTS,
  committed: false,
  showReal: false,

  hydrateFromURL: () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const m = url.searchParams.get("m");
    const l = url.searchParams.get("l");
    const r = url.searchParams.get("r");
    const y = url.searchParams.get("y");
    const real = url.searchParams.get("real");

    const patch: Partial<CalcInputs> = {};
    if (m !== null) {
      const v = Number(m);
      if (!isNaN(v)) patch.monthlyAmount = clamped(v, 500, 10_00_000);
    }
    if (l !== null) {
      const v = Number(l);
      if (!isNaN(v)) patch.lumpAmount = clamped(v, 1000, 5_00_00_000);
    }
    if (r !== null) {
      const v = Number(r);
      // r is in percent in the URL, e.g. r=12 → 0.12
      if (!isNaN(v)) patch.annualReturn = clamped(v / 100, -0.1, 0.4);
    }
    if (y !== null) {
      const v = Number(y);
      if (!isNaN(v)) patch.years = clamped(Math.floor(v), 1, 40);
    }
    set({
      ...patch,
      committed: true, // if URL has params, treat as committed
      showReal: real === "1",
    });
  },

  setMonthly: (v) => {
    const clamped_v = clamped(v, 500, 10_00_000);
    set({ monthlyAmount: clamped_v });
    syncURL(get());
  },

  setLump: (v) => {
    const clamped_v = clamped(v, 1000, 5_00_00_000);
    set({ lumpAmount: clamped_v });
    syncURL(get());
  },

  setAnnualReturn: (v) => {
    const clamped_v = clamped(v, -0.1, 0.4);
    set({ annualReturn: clamped_v });
    syncURL(get());
  },

  setYears: (v) => {
    const clamped_v = clamped(Math.floor(v), 1, 40);
    set({ years: clamped_v });
    syncURL(get());
  },

  setShowReal: (v) => {
    set({ showReal: v });
    syncURL(get());
  },

  commit: () => {
    set({ committed: true });
    syncURL(get());
  },

  reset: () => {
    set({ ...DEFAULT_INPUTS, committed: false, showReal: false });
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("m");
      url.searchParams.delete("l");
      url.searchParams.delete("r");
      url.searchParams.delete("y");
      url.searchParams.delete("real");
      window.history.replaceState({}, "", url.toString());
    }
  },
}));

function syncURL(state: InputsState) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("m", String(state.monthlyAmount));
  url.searchParams.set("l", String(state.lumpAmount));
  url.searchParams.set("r", String(Math.round(state.annualReturn * 100)));
  url.searchParams.set("y", String(state.years));
  if (state.showReal) url.searchParams.set("real", "1");
  else url.searchParams.delete("real");
  window.history.replaceState({}, "", url.toString());
}

/**
 * Selector returning the current CalcInputs (without store internals).
 */
export function selectCalcInputs(state: InputsState): CalcInputs {
  return {
    monthlyAmount: state.monthlyAmount,
    lumpAmount: state.lumpAmount,
    annualReturn: state.annualReturn,
    years: state.years,
    inflationRate: state.inflationRate ?? 0.06,
  };
}
