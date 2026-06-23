/**
 * Indian-style compact currency formatting.
 *
 *   1,000         → ₹1K
 *   50,000         → ₹50K
 *   1,20,000       → ₹1.2L
 *   50,00,000      → ₹50L
 *   1,00,00,000    → ₹1.0Cr
 *   12,50,00,000   → ₹12.5Cr
 *
 * Also exposes a `formatINR` for the full grouped Indian format
 * (useful in tooltips and share text) and a plain compact form
 * with no symbol.
 */

const LAKH = 1_00_000;
const CRORE = 1_00_00_000;
const THOUSAND = 1_000;

export function formatINRCompact(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "₹0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= CRORE) {
    const cr = value / CRORE;
    // Show 1 decimal under 10 Cr, no decimal above
    const formatted =
      Math.abs(cr) < 10 ? cr.toFixed(1) : Math.round(cr).toString();
    return `${sign}₹${formatted}Cr`;
  }
  if (abs >= LAKH) {
    const l = value / LAKH;
    const formatted =
      Math.abs(l) < 10 ? l.toFixed(1) : Math.round(l).toString();
    return `${sign}₹${formatted}L`;
  }
  if (abs >= THOUSAND) {
    const k = value / THOUSAND;
    const formatted =
      Math.abs(k) < 10 ? k.toFixed(1) : Math.round(k).toString();
    return `${sign}₹${formatted}K`;
  }
  return `${sign}₹${Math.round(value).toLocaleString("en-IN")}`;
}

/**
 * Full Indian grouping, e.g. ₹12,50,000. Used in share text and
 * accessibility labels for screen readers.
 */
export function formatINR(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "₹0";
  const rounded = Math.round(value);
  return `₹${rounded.toLocaleString("en-IN")}`;
}

/**
 * Plain number compact (no symbol). Useful for chart axis ticks
 * where space is tight.
 */
export function formatCompact(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= CRORE) {
    const cr = value / CRORE;
    return `${sign}${Math.abs(cr) < 10 ? cr.toFixed(1) : Math.round(cr)}Cr`;
  }
  if (abs >= LAKH) {
    const l = value / LAKH;
    return `${sign}${Math.abs(l) < 10 ? l.toFixed(1) : Math.round(l)}L`;
  }
  if (abs >= THOUSAND) {
    const k = value / THOUSAND;
    return `${sign}${Math.abs(k) < 10 ? k.toFixed(1) : Math.round(k)}K`;
  }
  return `${sign}${Math.round(value)}`;
}

/**
 * Percent formatter, e.g. 0.123 → "12.3%".
 */
export function formatPct(value: number, digits = 1): string {
  if (!isFinite(value) || isNaN(value)) return "0%";
  return `${(value * 100).toFixed(digits)}%`;
}

/**
 * Pluralize a unit, e.g. "15 years", "1 year".
 */
export function pluralize(n: number, singular: string, plural?: string): string {
  if (Math.abs(n) === 1) return `${n} ${singular}`;
  return `${n} ${plural ?? singular + "s"}`;
}
