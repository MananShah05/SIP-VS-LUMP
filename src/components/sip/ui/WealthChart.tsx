"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { usePrefersReducedMotion } from "@/hooks/sip/useScrollTrigger";
import { formatCompact, formatINRCompact } from "@/lib/formatters";
import { MILESTONES, type Milestone } from "@/lib/milestones";
import type { YearSnapshot } from "@/lib/calc";
import { cn } from "@/lib/utils";

interface WealthChartProps {
  timeline: YearSnapshot[];
  /** when true, show inflation-adjusted values */
  showReal?: boolean;
  /** total scroll distance (in viewport heights) the chart should be pinned for */
  scrollHeight?: number;
  className?: string;
}

/* ===========================================================
 * Label geometry helpers — pure functions, easy to verify.
 * The goal: no chart label ever overflows the plot area, and
 * SIP / Lump final labels never overlap each other.
 * =========================================================== */

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute a safe (x, y) for a label box anchored near a chart point.
 *
 * Default placement is to the right of the point. If that would
 * overflow the chart's right edge (with padding), flip to the left.
 * Clamp vertically so the label never leaves the plot area.
 */
export function getSafeLabelPosition({
  x,
  y,
  labelWidth,
  labelHeight,
  chartWidth,
  chartHeight,
  padding = 24,
}: {
  x: number;
  y: number;
  labelWidth: number;
  labelHeight: number;
  chartWidth: number;
  chartHeight: number;
  padding?: number;
}): Rect {
  // Default: place to the right of the point
  let safeX = x + 18;
  let safeY = y - labelHeight / 2;

  // Flip to the left if it would overflow right edge
  if (safeX + labelWidth > chartWidth - padding) {
    safeX = x - labelWidth - 18;
  }
  // If even that doesn't fit (point is far left), clamp to left edge
  if (safeX < padding) {
    safeX = padding;
  }
  // If clamped left and would still overflow right, just clamp right
  if (safeX + labelWidth > chartWidth - padding) {
    safeX = chartWidth - padding - labelWidth;
  }

  // Vertical clamping
  if (safeY < padding) safeY = padding;
  if (safeY + labelHeight > chartHeight - padding) {
    safeY = chartHeight - padding - labelHeight;
  }

  return { x: safeX, y: safeY, width: labelWidth, height: labelHeight };
}

/**
 * If two label rects overlap vertically (or are within `minGap`),
 * shift them apart along the y axis, preserving their midpoint.
 * Returns the new rects in the same order as input.
 */
export function avoidVerticalOverlap(
  a: Rect,
  b: Rect,
  minGap = 14
): [Rect, Rect] {
  const overlap =
    a.y < b.y + b.height + minGap &&
    a.y + a.height + minGap > b.y;

  if (!overlap) return [a, b];

  const midpoint = (a.y + a.height / 2 + b.y + b.height / 2) / 2;
  return [
    { ...a, y: midpoint - a.height - minGap / 2 },
    { ...b, y: midpoint + minGap / 2 },
  ];
}

/* ===========================================================
 * Constants — viewBox + margins
 *
 * Right padding is generous (90 viewBox units ≈ 80px desktop)
 * so callouts always have room on the right. On mobile we
 * switch the rendering entirely to a "compact result strip"
 * below the chart, so right-edge labels are never an issue.
 * =========================================================== */

const VB_W = 1000;
const VB_H = 560;
const M = { top: 40, right: 90, bottom: 50, left: 80 };
const INNER_W = VB_W - M.left - M.right;
const INNER_H = VB_H - M.top - M.bottom;

/** Estimated callout box size in viewBox units (used for collision math). */
const CALLOUT_W = 140;
const CALLOUT_H = 50;

/* ===========================================================
 * Component
 * =========================================================== */

export function WealthChart({
  timeline,
  showReal = false,
  scrollHeight = 4,
  className,
}: WealthChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);

  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const reduced = usePrefersReducedMotion();

  const effectiveProgress = reduced ? 1 : progress;
  const hasReachedEnd = effectiveProgress >= 0.999;

  // Mobile detection — drives whether we render inline callouts
  // or a compact result strip below the chart.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scales + paths
  const { xScale, yScale, sipPath, lumpPath, maxY } = useMemo(() => {
    const years = timeline[timeline.length - 1].year;
    const maxVal = Math.max(
      ...timeline.map((t) =>
        Math.max(
          showReal ? t.sipReal : t.sipValue,
          showReal ? t.lumpReal : t.lumpValue
        )
      )
    );
    const yMax = maxVal * 1.12;

    const x = d3.scaleLinear().domain([0, years]).range([0, INNER_W]);
    const y = d3.scaleLinear().domain([0, yMax]).range([INNER_H, 0]);

    const sipLine = d3
      .line<YearSnapshot>()
      .x((d) => x(d.year))
      .y((d) => y(showReal ? d.sipReal : d.sipValue))
      .curve(d3.curveMonotoneX);

    const lumpLine = d3
      .line<YearSnapshot>()
      .x((d) => x(d.year))
      .y((d) => y(showReal ? d.lumpReal : d.lumpValue))
      .curve(d3.curveMonotoneX);

    return {
      xScale: x,
      yScale: y,
      sipPath: sipLine(timeline) || "",
      lumpPath: lumpLine(timeline) || "",
      maxY: yMax,
    };
  }, [timeline, showReal]);

  const yTicks = useMemo(() => {
    const t = yScale.ticks(5);
    return t.map((v) => ({ v, y: yScale(v) }));
  }, [yScale]);

  const xTicks = useMemo(() => {
    const years = timeline[timeline.length - 1].year;
    const step = years <= 5 ? 1 : years <= 15 ? 2 : years <= 25 ? 5 : 10;
    const ticks: number[] = [];
    for (let i = 0; i <= years; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== years) ticks.push(years);
    return ticks.map((v) => ({ v, x: xScale(v) }));
  }, [xScale, timeline]);

  /* ----- Live follower (current year, current SIP/Lump values) -----
   * Interpolate smoothly between year snapshots so the follower
   * dots glide instead of snapping to each integer year.
   */
  const exactIndex = effectiveProgress * (timeline.length - 1);
  const currentIdx = Math.min(
    timeline.length - 1,
    Math.floor(exactIndex)
  );
  const nextIdx = Math.min(timeline.length - 1, currentIdx + 1);
  const frac = exactIndex - currentIdx;

  const snapA = timeline[currentIdx];
  const snapB = timeline[nextIdx];

  // Linear interpolation between two snapshots
  const lerp = (a: number, b: number) => a + (b - a) * frac;

  const current = {
    year: lerp(snapA.year, snapB.year),
    sipValue: lerp(snapA.sipValue, snapB.sipValue),
    lumpValue: lerp(snapA.lumpValue, snapB.lumpValue),
    sipReal: lerp(snapA.sipReal, snapB.sipReal),
    lumpReal: lerp(snapA.lumpReal, snapB.lumpReal),
  };

  // For display of the year label, round to the nearest integer
  const currentYearLabel = hasReachedEnd
    ? timeline[timeline.length - 1].year
    : Math.max(0, Math.round(current.year));

  const currentX = xScale(current.year);
  const currentSipY = yScale(showReal ? current.sipReal : current.sipValue);
  const currentLumpY = yScale(showReal ? current.lumpReal : current.lumpValue);

  const last = timeline[timeline.length - 1];
  /* ----- Final-point positions (for callouts at chart end) ----- */
  const finalSipX = xScale(last.year);
  const finalSipY = yScale(showReal ? last.sipReal : last.sipValue);
  const finalLumpX = xScale(last.year);
  const finalLumpY = yScale(showReal ? last.lumpReal : last.lumpValue);

  // Compute safe callout positions for SIP and Lump final labels
  const { sipCallout, lumpCallout } = useMemo(() => {
    const sipRaw = getSafeLabelPosition({
      x: finalSipX,
      y: finalSipY,
      labelWidth: CALLOUT_W,
      labelHeight: CALLOUT_H,
      chartWidth: VB_W,
      chartHeight: VB_H,
      padding: 16,
    });
    const lumpRaw = getSafeLabelPosition({
      x: finalLumpX,
      y: finalLumpY,
      labelWidth: CALLOUT_W,
      labelHeight: CALLOUT_H,
      chartWidth: VB_W,
      chartHeight: VB_H,
      padding: 16,
    });
    const [sipFixed, lumpFixed] = avoidVerticalOverlap(sipRaw, lumpRaw, 16);
    return { sipCallout: sipFixed, lumpCallout: lumpFixed };
  }, [finalSipX, finalSipY, finalLumpX, finalLumpY]);

  const visibleMilestones = useMemo(
    () => MILESTONES.filter((m) => m.value <= maxY * 0.95),
    [maxY]
  );

  /* ----- ScrollTrigger pin ----- */
  useEffect(() => {
    if (reduced) return;
    if (!containerRef.current || !stickyRef.current) return;

    let active = true;
    let st: { kill: () => void } | null = null;

    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      if (!active || !containerRef.current) return;

      st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: () => {
          const containerHeight = containerRef.current?.offsetHeight ?? 0;
          const usableScroll = Math.max(
            window.innerHeight,
            containerHeight - window.innerHeight
          );
          return `+=${usableScroll}`;
        },
        scrub: 0.5,
        onUpdate: (self) => setProgress(self.progress),
        onLeaveBack: () => setProgress(0),
        onLeave: () => setProgress(1),
        invalidateOnRefresh: true,
      });
    })();

    return () => {
      active = false;
      st?.kill();
    };
  }, [reduced, scrollHeight]);

  /* ----- Path reveal via clip-path -----
   * Both paths are drawn statically (SIP solid, Lump dashed for
   * accessibility). A single clip rect grows from left to right
   * with scroll progress, revealing them. This avoids the
   * "marching ants" artefact you get when animating
   * stroke-dashoffset on an already-dashed line.
   */
  const clipWidth = INNER_W * effectiveProgress + 1; // +1 to avoid 0-width edge artefact

  /* ----- Reduced-motion: show everything immediately ----- */
  const showAll = reduced || hasReachedEnd;

  /* ----- Milestones revealed by current progress ----- */
  const revealedMilestones: Milestone[] = useMemo(() => {
    const maxVisible = showReal ? current.sipReal : current.sipValue;
    return visibleMilestones.filter((m) => m.value <= maxVisible);
  }, [current, showReal, visibleMilestones]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ height: `${scrollHeight * 100}vh` }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-[100svh] w-full flex flex-col items-center justify-center px-4 sm:px-8 py-8 overflow-hidden"
      >
        {/* Header */}
        <div className="w-full max-w-5xl flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <LegendItem
              color="var(--sip)"
              label="SIP"
              dashed={false}
              value={formatINRCompact(
                showReal ? current.sipReal : current.sipValue
              )}
            />
            <LegendItem
              color="var(--lump)"
              label="Lump"
              dashed
              value={formatINRCompact(
                showReal ? current.lumpReal : current.lumpValue
              )}
            />
          </div>
          <div className="font-mono-num text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.18em]">
            Year {currentYearLabel}
          </div>
        </div>

        {/* Chart */}
        <div className="w-full max-w-5xl aspect-[1000/560] relative">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Wealth growth chart — SIP and Lump Sum over time"
            role="img"
          >
            {/* Y-axis grid lines + labels */}
            <g>
              {yTicks.map((t) => (
                <g key={`y-${t.v}`}>
                  <line
                    x1={M.left}
                    x2={M.left + INNER_W}
                    y1={M.top + t.y}
                    y2={M.top + t.y}
                    stroke="oklch(28% 0.012 260)"
                    strokeWidth={1}
                    strokeDasharray="2 4"
                  />
                  <text
                    x={M.left - 12}
                    y={M.top + t.y + 4}
                    textAnchor="end"
                    className="font-mono-num"
                    fontSize={12}
                    fill="oklch(58% 0.012 260)"
                  >
                    ₹{formatCompact(t.v)}
                  </text>
                </g>
              ))}
            </g>

            {/* X-axis labels */}
            <g>
              {xTicks.map((t) => (
                <g key={`x-${t.v}`}>
                  <line
                    x1={M.left + t.x}
                    x2={M.left + t.x}
                    y1={M.top + INNER_H}
                    y2={M.top + INNER_H + 6}
                    stroke="oklch(40% 0.014 260)"
                    strokeWidth={1}
                  />
                  <text
                    x={M.left + t.x}
                    y={M.top + INNER_H + 24}
                    textAnchor="middle"
                    className="font-mono-num"
                    fontSize={12}
                    fill="oklch(58% 0.012 260)"
                  >
                    Y{t.v}
                  </text>
                </g>
              ))}
            </g>

            {/* Milestone horizontal markers */}
            <g>
              {visibleMilestones.map((m) => {
                const y = yScale(m.value);
                const revealed = revealedMilestones.find(
                  (rm) => rm.value === m.value
                );
                return (
                  <g
                    key={`m-${m.value}`}
                    opacity={revealed ? 1 : 0.18}
                    style={{ transition: "opacity 0.4s ease" }}
                  >
                    <line
                      x1={M.left}
                      x2={M.left + INNER_W}
                      y1={M.top + y}
                      y2={M.top + y}
                      stroke={
                        revealed
                          ? "oklch(72% 0.18 145 / 0.32)"
                          : "oklch(40% 0.014 260 / 0.5)"
                      }
                      strokeWidth={1}
                      strokeDasharray={revealed ? "0" : "1 3"}
                    />
                    {/* Left-side milestone tag (away from right-edge labels) */}
                    <text
                      x={M.left + 8}
                      y={M.top + y - 5}
                      textAnchor="start"
                      fontSize={11}
                      className="font-mono-num"
                      fill={
                        revealed
                          ? "oklch(82% 0.12 145 / 0.85)"
                          : "oklch(58% 0.012 260)"
                      }
                    >
                      {m.tag}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Vertical progress line */}
            <line
              x1={M.left + currentX}
              x2={M.left + currentX}
              y1={M.top}
              y2={M.top + INNER_H}
              stroke="oklch(92% 0.008 260 / 0.4)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* ===== Wealth paths, revealed left-to-right by a clip rect ===== */}
            <defs>
              <clipPath id="chart-reveal-clip">
                <rect
                  x={M.left}
                  y={M.top - 4}
                  width={showAll ? INNER_W + 4 : clipWidth}
                  height={INNER_H + 8}
                />
              </clipPath>
            </defs>

            <g clipPath="url(#chart-reveal-clip)">
              {/* Lump path — dashed amber for accessibility (non-color-only indicator) */}
              <path
                d={lumpPath}
                transform={`translate(${M.left}, ${M.top})`}
                fill="none"
                stroke="var(--lump)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 6"
              />
              {/* SIP path — solid emerald */}
              <path
                d={sipPath}
                transform={`translate(${M.left}, ${M.top})`}
                fill="none"
                stroke="var(--sip)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Final-point dots */}
            {showAll && (
              <>
                <circle
                  cx={M.left + finalLumpX}
                  cy={M.top + finalLumpY}
                  r={6}
                  fill="var(--lump)"
                  stroke="oklch(12% 0.01 260)"
                  strokeWidth={2}
                />
                <circle
                  cx={M.left + finalSipX}
                  cy={M.top + finalSipY}
                  r={6}
                  fill="var(--sip)"
                  stroke="oklch(12% 0.01 260)"
                  strokeWidth={2}
                />
              </>
            )}

            {/* Live follower dots (glide smoothly with scroll progress) */}
            {!showAll && (
              <>
                <circle
                  cx={M.left + currentX}
                  cy={M.top + currentLumpY}
                  r={5}
                  fill="var(--lump)"
                  opacity={0.9}
                />
                <circle
                  cx={M.left + currentX}
                  cy={M.top + currentSipY}
                  r={5}
                  fill="var(--sip)"
                  opacity={0.9}
                />
              </>
            )}

            {/* ===== Final-label callouts (desktop only) ===== */}
            {!isMobile && showAll && (
              <g>
                {/* Leader line + callout for SIP */}
                <LeaderLine
                  fromX={M.left + finalSipX}
                  fromY={M.top + finalSipY}
                  toX={M.left + sipCallout.x + sipCallout.width / 2}
                  toY={M.top + sipCallout.y + sipCallout.height / 2}
                  color="var(--sip)"
                />
                <ChartCallout
                  x={M.left + sipCallout.x}
                  y={M.top + sipCallout.y}
                  width={sipCallout.width}
                  height={sipCallout.height}
                  label="SIP"
                  value={formatINRCompact(
                    showReal ? last.sipReal : last.sipValue
                  )}
                  color="var(--sip)"
                  softColor="var(--sip-soft)"
                  dashed={false}
                />

                {/* Leader line + callout for Lump */}
                <LeaderLine
                  fromX={M.left + finalLumpX}
                  fromY={M.top + finalLumpY}
                  toX={M.left + lumpCallout.x + lumpCallout.width / 2}
                  toY={M.top + lumpCallout.y + lumpCallout.height / 2}
                  color="var(--lump)"
                />
                <ChartCallout
                  x={M.left + lumpCallout.x}
                  y={M.top + lumpCallout.y}
                  width={lumpCallout.width}
                  height={lumpCallout.height}
                  label="Lump Sum"
                  value={formatINRCompact(
                    showReal ? last.lumpReal : last.lumpValue
                  )}
                  color="var(--lump)"
                  softColor="var(--lump-soft)"
                  dashed
                />
              </g>
            )}
          </svg>

          {/* Mobile milestone chips below chart */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-1 sm:-bottom-2 flex justify-center">
            <div className="flex flex-wrap gap-2 justify-center max-w-full">
              {revealedMilestones.slice(-3).map((m) => (
                <span
                  key={m.value}
                  className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-[oklch(72%_0.18_145_/_0.1)] border border-[oklch(72%_0.18_145_/_0.3)] text-[oklch(82%_0.16_145)] font-mono-num whitespace-nowrap"
                >
                  ✓ {m.tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Mobile compact result strip (instead of inline callouts) ===== */}
        {isMobile && (
          <div className="w-full max-w-md mt-6 grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-2xl p-4 border-l-2" style={{ borderLeftColor: "var(--sip)" }}>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mb-1">
                SIP
              </div>
              <div className="font-mono-num text-xl" style={{ color: "var(--sip)" }}>
                {formatINRCompact(showReal ? last.sipReal : last.sipValue)}
              </div>
            </div>
            <div
              className="glass-panel rounded-2xl p-4 border-l-2"
              style={{ borderLeftColor: "var(--lump)" }}
            >
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono-num mb-1">
                Lump
              </div>
              <div className="font-mono-num text-xl" style={{ color: "var(--lump)" }}>
                {formatINRCompact(showReal ? last.lumpReal : last.lumpValue)}
              </div>
            </div>
          </div>
        )}

        {/* Helper text */}
        <div className="mt-6 sm:mt-8 text-center max-w-md">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {reduced
              ? "Full wealth trajectory. SIP in emerald (solid), Lump Sum in amber (dashed)."
              : "Keep scrolling. The lines draw as your years pass."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
 * Sub-components
 * =========================================================== */

function LegendItem({
  color,
  label,
  dashed,
  value,
}: {
  color: string;
  label: string;
  dashed: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg width="22" height="6" className="shrink-0">
        <line
          x1="0"
          y1="3"
          x2="22"
          y2="3"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? "5 3" : undefined}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-[0.12em] font-mono-num">
        {label}
      </span>
      <span className="font-mono-num text-sm sm:text-base font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

/**
 * SVG callout card. A glassy rounded rectangle with a small color
 * tab on the left, a label and a value. Rendered as SVG (not HTML)
 * so it scales with the viewBox.
 */
function ChartCallout({
  x,
  y,
  width,
  height,
  label,
  value,
  color,
  softColor,
  dashed,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value: string;
  color: string;
  softColor: string;
  dashed: boolean;
}) {
  return (
    <g>
      {/* Card background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill="oklch(18% 0.012 260 / 0.92)"
        stroke={softColor}
        strokeWidth={1}
      />
      {/* Color tab on the left */}
      <rect
        x={x}
        y={y}
        width={3}
        height={height}
        rx={1.5}
        ry={1.5}
        fill={color}
        opacity={dashed ? 0.7 : 1}
      />
      {/* Label */}
      <text
        x={x + 12}
        y={y + 18}
        fontSize={11}
        className="font-mono-num"
        fill="oklch(62% 0.012 260)"
        style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}
      >
        {label}
      </text>
      {/* Value */}
      <text
        x={x + 12}
        y={y + 38}
        fontSize={18}
        className="font-mono-num"
        fill={color}
        fontWeight={600}
      >
        {value}
      </text>
    </g>
  );
}

/**
 * SVG leader line from a chart point to a callout. Subtle dotted
 * curve so it reads as a connector, not data.
 */
function LeaderLine({
  fromX,
  fromY,
  toX,
  toY,
  color,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}) {
  // Build a subtle L-shape path: from point, step out a bit horizontally,
  // then up/down to the callout center.
  const midX = (fromX + toX) / 2;
  const d = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={1}
      strokeDasharray="2 3"
      opacity={0.55}
    />
  );
}
