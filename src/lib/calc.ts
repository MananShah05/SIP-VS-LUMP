/**
 * SIP vs Lump Sum — Core math engine
 * ----------------------------------
 * All formulas use annual compounding for lump sum and monthly
 * compounding for SIP. The SIP formula below matches the product
 * spec's annuity-due convention, so each monthly contribution gets
 * one extra month of compounding.
 */

export interface CalcInputs {
  /** ₹ per month into the SIP */
  monthlyAmount: number;
  /** one-time lump sum invested on day 1 */
  lumpAmount: number;
  /** annual return as a decimal, e.g. 0.12 for 12% */
  annualReturn: number;
  /** investment horizon in years */
  years: number;
  /** annual inflation as a decimal, default 0.06 */
  inflationRate?: number;
}

export interface YearSnapshot {
  /** year index, 0 = start, 1 = end of year 1, ... */
  year: number;
  sipValue: number;
  lumpValue: number;
  sipInvested: number;
  lumpInvested: number;
  sipGain: number;
  lumpGain: number;
  /** inflation-adjusted SIP value, current purchasing power */
  sipReal: number;
  lumpReal: number;
}

/**
 * SIP future value.
 * Standard formula: FV = P × [((1+r)^n − 1) / r] × (1+r)
 * where r = monthly rate, n = total months. The (1+r) factor
 * accounts for annuity-due (contributions at start of month),
 * matching the product's "monthly SIP" comparison convention.
 */
export function calcSIP(
  monthly: number,
  annualRate: number,
  years: number
): number {
  if (monthly <= 0 || years <= 0) return 0;
  if (annualRate === 0) return monthly * 12 * years;
  const r = annualRate / 12;
  const n = years * 12;
  return monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

/**
 * Lump sum future value.
 * FV = P × (1 + r)^n  (annual compounding)
 */
export function calcLump(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;
  return principal * Math.pow(1 + annualRate, years);
}

/**
 * SIP value at the end of a specific year (used for the timeline).
 * Same formula as calcSIP but parameterised by year count.
 */
export function sipValueAtYear(
  monthly: number,
  annualRate: number,
  year: number
): number {
  if (monthly <= 0 || year <= 0) return 0;
  if (annualRate === 0) return monthly * 12 * year;
  const r = annualRate / 12;
  const n = year * 12;
  return monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

/**
 * Lump sum value at the end of a specific year.
 */
export function lumpValueAtYear(
  principal: number,
  annualRate: number,
  year: number
): number {
  if (principal <= 0 || year <= 0) return principal;
  return principal * Math.pow(1 + annualRate, year);
}

/**
 * Generate year-by-year snapshots from year 0 to years inclusive.
 * Year 0 is the initial state (lump invested, nothing in SIP yet).
 */
export function generateTimeline(inputs: CalcInputs): YearSnapshot[] {
  const {
    monthlyAmount,
    lumpAmount,
    annualReturn,
    years,
    inflationRate = 0.06,
  } = inputs;

  const timeline: YearSnapshot[] = [];
  for (let y = 0; y <= years; y++) {
    const sipValue = sipValueAtYear(monthlyAmount, annualReturn, y);
    const lumpValue = lumpValueAtYear(lumpAmount, annualReturn, y);
    const sipInvested = monthlyAmount * 12 * y;
    const lumpInvested = y === 0 ? lumpAmount : lumpAmount;
    const sipGain = sipValue - sipInvested;
    const lumpGain = lumpValue - lumpInvested;
    const sipReal = realValue(sipValue, inflationRate, y);
    const lumpReal = realValue(lumpValue, inflationRate, y);

    timeline.push({
      year: y,
      sipValue,
      lumpValue,
      sipInvested,
      lumpInvested,
      sipGain,
      lumpGain,
      sipReal,
      lumpReal,
    });
  }
  return timeline;
}

/**
 * Find the first year (integer, ≥1) at which SIP value catches up
 * to or exceeds Lump value. Returns null if SIP never catches up.
 *
 * Note: in classic SIP-vs-Lump math, SIP usually never catches up
 * when the lump sum equals the *first year's* SIP contribution
 * (12×monthly). It typically only catches up if the lump is small
 * relative to total SIP contributions. We surface the truth either
 * way — see Act 3 copy.
 */
export function findCrossover(
  timeline: YearSnapshot[]
): { year: number; sipValue: number; lumpValue: number } | null {
  for (let i = 1; i < timeline.length; i++) {
    const snap = timeline[i];
    const prev = timeline[i - 1];
    // crossover = SIP was below, now at or above
    if (prev.sipValue < prev.lumpValue && snap.sipValue >= snap.lumpValue) {
      return {
        year: snap.year,
        sipValue: snap.sipValue,
        lumpValue: snap.lumpValue,
      };
    }
  }
  return null;
}

/**
 * Real (inflation-adjusted) value of a nominal amount.
 * real = nominal / (1 + inflation)^years
 */
export function realValue(
  nominal: number,
  inflationRate: number,
  years: number
): number {
  if (years <= 0) return nominal;
  return nominal / Math.pow(1 + inflationRate, years);
}

/**
 * Annualized return for a lump sum.
 */
export function lumpAnnualizedReturn(
  finalValue: number,
  totalInvested: number,
  years: number
): number {
  if (years <= 0 || totalInvested <= 0) return 0;
  return Math.pow(finalValue / totalInvested, 1 / years) - 1;
}

/**
 * Annualized IRR for a SIP with regular monthly contributions.
 * Cash flows are modeled using the same annuity-due convention as
 * the FV calculation: each contribution happens at the start of the
 * month and the terminal value is received at the end.
 */
export function sipAnnualizedIRR(
  monthlyAmount: number,
  finalValue: number,
  years: number
): number {
  if (monthlyAmount <= 0 || finalValue <= 0 || years <= 0) return 0;

  const months = years * 12;
  const npv = (monthlyRate: number) => {
    let total = finalValue / Math.pow(1 + monthlyRate, months);
    for (let month = 0; month < months; month++) {
      total -= monthlyAmount / Math.pow(1 + monthlyRate, month);
    }
    return total;
  };

  let low = -0.9999;
  let high = 1;
  let lowValue = npv(low);
  let highValue = npv(high);

  while (lowValue * highValue > 0 && high < 8) {
    high *= 2;
    highValue = npv(high);
  }

  if (lowValue * highValue > 0) return 0;

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    const midValue = npv(mid);
    if (Math.abs(midValue) < 1e-7) {
      return Math.pow(1 + mid, 12) - 1;
    }
    if (lowValue * midValue <= 0) {
      high = mid;
      highValue = midValue;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }

  const monthlyRate = (low + high) / 2;
  return Math.pow(1 + monthlyRate, 12) - 1;
}

/**
 * Final snapshot for a given set of inputs (the last entry of the
 * timeline). Convenience helper.
 */
export function finalSnapshot(inputs: CalcInputs): YearSnapshot {
  const t = generateTimeline(inputs);
  return t[t.length - 1];
}

/**
 * Default inputs for first paint and for share links that don't
 * pass anything.
 *
 * Per spec: the default lump sum equals the *total SIP principal*
 * over the horizon (monthly × 12 × years) so the comparison is
 * fair — same total money in, different timing.
 */
export const DEFAULT_INPUTS: CalcInputs = {
  monthlyAmount: 10000,
  lumpAmount: 10000 * 12 * 15, // = 18,00,000 (matches total SIP principal at defaults)
  annualReturn: 0.12,
  years: 15,
  inflationRate: 0.06,
};

/**
 * Recompute the "fair" lump sum for a given monthly + years pair.
 * Used by the Hero's lump toggle when the user enables the
 * "Match total SIP principal" preset.
 */
export function fairLumpAmount(monthly: number, years: number): number {
  return monthly * 12 * years;
}
