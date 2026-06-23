/**
 * Indian-context wealth milestones. Used by the chart to drop markers
 * on the canvas, by Section 4 (Milestone Moments) to render floating
 * cards as the user scrolls, and by Section 6 (Final Reveal) to
 * surface an emotional headline.
 *
 * Values are in rupees. Sorted ascending.
 */
export interface Milestone {
  value: number;
  label: string;
  /** short tag for the chart marker badge */
  tag?: string;
  /** one-line emotional copy used in Section 4 milestone cards */
  moment?: string;
}

export const MILESTONES: Milestone[] = [
  {
    value: 1_00_000,
    label: "First ₹1L",
    tag: "1L",
    moment: "Your SIP crosses ₹1L. That is no longer 'small savings'.",
  },
  {
    value: 5_00_000,
    label: "Emergency fund unlocked",
    tag: "5L",
    moment: "Six months of expenses, locked in. You can breathe now.",
  },
  {
    value: 10_00_000,
    label: "First ₹10L",
    tag: "10L",
    moment: "Seven figures in your wealth statement. Not a milestone, a mindset shift.",
  },
  {
    value: 25_00_000,
    label: "Down payment territory",
    tag: "25L",
    moment: "A real home down payment starts to feel reachable.",
  },
  {
    value: 50_00_000,
    label: "Serious wealth engine",
    tag: "50L",
    moment: "Your portfolio is starting to do heavy lifting on its own.",
  },
  {
    value: 1_00_00_000,
    label: "Crorepati moment",
    tag: "1Cr",
    moment: "One crore. The landmark every investor recognizes instantly.",
  },
  {
    value: 5_00_00_000,
    label: "Retirement cushion",
    tag: "5Cr",
    moment: "Five crore. The kind of number that buys real optionality.",
  },
];

/**
 * Return the most emotionally resonant milestone crossed by a
 * given value. We pick the largest crossed milestone still <= value.
 */
export function topMilestoneFor(value: number): Milestone | null {
  if (value <= 0) return null;
  let result: Milestone | null = null;
  for (const m of MILESTONES) {
    if (value >= m.value) result = m;
    else break;
  }
  return result;
}

/**
 * Return all milestones whose values fall between `from` and `to`
 * (exclusive on from, inclusive on to).
 */
export function milestonesBetween(from: number, to: number): Milestone[] {
  const out: Milestone[] = [];
  for (const m of MILESTONES) {
    if (m.value > from && m.value <= to) out.push(m);
  }
  return out;
}

export type MilestonePath = "sip" | "lump" | "either";

/**
 * Find the year (integer, >=1) at which a given value is first
 * reached by the selected path.
 */
export function yearWhenValueReached(
  timeline: { year: number; sipValue: number; lumpValue: number }[],
  value: number,
  path: MilestonePath = "sip"
): number | null {
  for (const snap of timeline) {
    if (snap.year === 0) continue;
    const reached =
      path === "sip"
        ? snap.sipValue >= value
        : path === "lump"
          ? snap.lumpValue >= value
          : snap.sipValue >= value || snap.lumpValue >= value;
    if (reached) return snap.year;
  }
  return null;
}

/**
 * Group milestones by the year each is first reached by the
 * selected path.
 */
export interface MilestoneGroup {
  year: number;
  milestones: Milestone[];
}

export function groupMilestonesByYear(
  timeline: { year: number; sipValue: number; lumpValue: number }[],
  path: MilestonePath = "sip"
): MilestoneGroup[] {
  const map = new Map<number, Milestone[]>();
  for (const m of MILESTONES) {
    const y = yearWhenValueReached(timeline, m.value, path);
    if (y === null) continue;
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(m);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, milestones]) => ({ year, milestones }));
}

/**
 * Verdict line for the share card / Section 6 headline. Compares SIP
 * and Lump final values and returns a single punchy sentence.
 */
export function verdictLine(
  sipFinal: number,
  lumpFinal: number,
  years: number
): string {
  const diff = sipFinal - lumpFinal;
  const absDiff = Math.abs(diff);
  const pct = absDiff / Math.max(1, Math.min(sipFinal, lumpFinal));

  if (Math.abs(diff) < 1) {
    return `A tie over ${years} years. Capital and consistency arrived together.`;
  }
  if (diff > 0) {
    if (pct > 0.5) {
      return "SIP pulled ahead. Small monthly decisions became a serious wealth engine.";
    }
    return `SIP edged ahead by ${Math.round(pct * 100)}%. Consistency quietly overtook timing.`;
  }
  if (pct > 0.5) {
    return "Lump Sum created more wealth because it had more time in the market. SIP still won on accessibility.";
  }
  return `Lump Sum won the spreadsheet by ${Math.round(pct * 100)}%. SIP still asked the more realistic question: when did you actually have the money?`;
}

/**
 * Short verdict used in the share card split bar.
 */
export function shortVerdict(
  sipFinal: number,
  lumpFinal: number
): string {
  if (sipFinal > lumpFinal) return "SIP wins";
  if (lumpFinal > sipFinal) return "Lump wins";
  return "Dead heat";
}

/**
 * Editorial framing line for Section 5 / Section 6.
 */
export function rewardsFraming(): string {
  return "Lump Sum rewards capital. SIP rewards consistency.";
}
