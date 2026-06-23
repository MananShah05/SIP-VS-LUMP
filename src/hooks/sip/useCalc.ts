/**
 * useCalc — reactive calc from Zustand inputs.
 * Returns the timeline, final snapshot, and crossover (memoised).
 */

"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useInputs } from "@/store/inputs";
import {
  generateTimeline,
  findCrossover,
  sipAnnualizedIRR,
  lumpAnnualizedReturn,
  type YearSnapshot,
  type CalcInputs,
} from "@/lib/calc";

export interface CalcResult {
  inputs: CalcInputs;
  timeline: YearSnapshot[];
  final: YearSnapshot;
  crossover: { year: number; sipValue: number; lumpValue: number } | null;
  sipCAGR: number;
  lumpCAGR: number;
  showReal: boolean;
}

export function useCalc(): CalcResult {
  // useShallow ensures the selector returns a stable reference when
  // the underlying primitive values haven't changed — required for
  // Zustand v5's useSyncExternalStore-based subscription.
  const inputs = useInputs(
    useShallow((s) => ({
      monthlyAmount: s.monthlyAmount,
      lumpAmount: s.lumpAmount,
      annualReturn: s.annualReturn,
      years: s.years,
      inflationRate: s.inflationRate ?? 0.06,
    }))
  );
  const showReal = useInputs((s) => s.showReal);

  return useMemo(() => {
    const timeline = generateTimeline(inputs);
    const final = timeline[timeline.length - 1];
    const crossover = findCrossover(timeline);
    const sipCAGR = sipAnnualizedIRR(
      inputs.monthlyAmount,
      final.sipValue,
      inputs.years
    );
    const lumpCAGR = lumpAnnualizedReturn(final.lumpValue, final.lumpInvested, inputs.years);
    return { inputs, timeline, final, crossover, sipCAGR, lumpCAGR, showReal };
  }, [inputs, showReal]);
}
