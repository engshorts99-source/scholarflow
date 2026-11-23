"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { YearCount } from "@/lib/types";
import { Calendar, TrendingUp, Award } from "lucide-react";

interface MiniSparklineProps {
  points: { label: string; value: number }[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  className?: string;
}

export function MiniSparkline({
  points,
  height = 44,
  strokeColor = "#3b82f6",
  fillColor = "rgba(59, 130, 246, 0.18)",
  className = "",
}: MiniSparklineProps) {
  const width = 180;
  const pad = 4;

  const { areaPath, linePath, peakPoint } = useMemo(() => {
    if (!points || points.length === 0) {
      return { areaPath: "", linePath: "", peakPoint: null };
    }
    const maxVal = Math.max(...points.map((p) => p.value), 1);
    const len = points.length;

    const coords = points.map((p, idx) => {
      const x =
        len === 1
          ? width / 2
          : pad + (idx / (len - 1)) * (width - pad * 2);
      const y =
        height - pad - (p.value / maxVal) * (height - pad * 2);
      return { x, y, ...p };
    });

    if (coords.length === 1) {
      const c = coords[0];
      const lp = `M ${pad} ${c.y} L ${width - pad} ${c.y}`;
      const ap = `${lp} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`;
      return { areaPath: ap, linePath: lp, peakPoint: c };
    }

    const lp = coords
      .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");
    const ap = `${lp} L ${coords[coords.length - 1].x.toFixed(1)} ${(height - pad).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(height - pad).toFixed(1)} Z`;

    const peak = coords.reduce((best, cur) =>
      cur.value > best.value ? cur : best
    );

    return { areaPath: ap, linePath: lp, peakPoint: peak };
  }, [points, height]);

  if (!points || points.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
      style={{ height }}
      aria-label="Publication trajectory sparkline"
    >
      <path d={areaPath} fill={fillColor} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {peakPoint && (
        <circle
          cx={peakPoint.x}
          cy={peakPoint.y}
          r={2.8}
          fill="#10b981"
          stroke="#0b0f19"
          strokeWidth={1.2}
        >
          <title>{`Peak ${peakPoint.label}: ${peakPoint.value.toLocaleString()}`}</title>
        </circle>
      )}
    </svg>
  );
}

interface ConceptTimelineChartProps {
  query: string;
  yearCounts: YearCount[];
  originYear: number | null;
  peakYear: number | null;
}

export default function ConceptTimelineChart({
  query,
  yearCounts,
  originYear,
  peakYear,
}: ConceptTimelineChartProps) {
  const router = useRouter();
  const gradientId = useId().replace(/:/g, "");
  const [hoveredYear, setHoveredYear] = useState<YearCount | null>(null);

  const filledSeries = useMemo(() => {
    if (!yearCounts || yearCounts.length === 0) return [];
    const firstY = originYear
      ? Math.min(originYear, yearCounts[0].year)
      : yearCounts[0].year;
    const lastY = yearCounts[yearCounts.length - 1].year;
    const countMap = new Map(yearCounts.map((y) => [y.year, y.count]));

    // If very long historical tail (> 45 years), cap visual window gracefully to keep bars crisp
    const minStart = Math.max(firstY, lastY - 45);
    const out: YearCount[] = [];
    for (let y = minStart; y <= lastY; y++) {
      out.push({ year: y, count: countMap.get(y) || 0 });
    }
    return out;
  }, [yearCounts, originYear]);

  const width = 760;
  const height = 240;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 28;
  const padBottom = 34;

  const { maxCount, points, areaPath, linePath, barWidth } = useMemo(() => {
    if (filledSeries.length === 0) {
      return {
        maxCount: 1,
        points: [],
        areaPath: "",
        linePath: "",
        barWidth: 10,
      };
    }
    const maxC = Math.max(...filledSeries.map((d) => d.count), 1);
    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;
    const n = filledSeries.length;
    const bw = Math.max(4, Math.min(26, (innerW / Math.max(n, 1)) * 0.65));

    const pts = filledSeries.map((d, idx) => {
      const x =
        n === 1
          ? padLeft + innerW / 2
          : padLeft + (idx / (n - 1)) * innerW;
      const y = padTop + innerH - (d.count / maxC) * innerH;
      const barH = (d.count / maxC) * innerH;
      return {
        ...d,
        x,
        y,
        barH,
      };
    });

    const lp =
      pts.length === 1
        ? `M ${padLeft} ${pts[0].y} L ${width - padRight} ${pts[0].y}`
        : pts
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(" ");

    const baseY = padTop + innerH;
    const ap =
      pts.length === 1
        ? `${lp} L ${width - padRight} ${baseY} L ${padLeft} ${baseY} Z`
        : `${lp} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY.toFixed(1)} L ${pts[0].x.toFixed(1)} ${baseY.toFixed(1)} Z`;

    return { maxCount: maxC, points: pts, areaPath: ap, linePath: lp, barWidth: bw };
  }, [filledSeries]);

  if (filledSeries.length === 0) return null;

  const handleYearClick = (year: number) => {
    router.push(
      `/search?q=${encodeURIComponent(query)}&yearFrom=${year}&yearTo=${year}&sort=citations`
    );
  };

  const innerH = height - padTop - padBottom;
  const yTicks = [0, 0.5, 1].map((frac) => ({
    y: padTop + innerH * (1 - frac),
    val: Math.round(maxCount * frac),
  }));

  const labelStep = Math.max(1, Math.ceil(points.length / 7));

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white font-space flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Publication Trajectory Over Time
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Annual research volume from {filledSeries[0].year} to{" "}
            {filledSeries[filledSeries.length - 1].year}. Click any year to inspect its papers.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {hoveredYear ? (
            <div className="px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-200 font-medium flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{hoveredYear.year}:</span>
              <span className="text-white font-semibold">
                {hoveredYear.count.toLocaleString()} papers
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              {originYear && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-mint-400"></span>
                  Origin ({originYear})
                </span>
              )}
              {peakYear && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  Peak ({peakYear})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[460px] h-auto select-none"
          role="img"
          aria-label={`Publication trajectory chart for ${query}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={t.y}
                x2={width - padRight}
                y2={t.y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 8}
                y={t.y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#64748b"
              >
                {t.val >= 1000 ? `${(t.val / 1000).toFixed(1)}k` : t.val}
              </text>
            </g>
          ))}

          {/* Area Fill & Line */}
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="#60a5fa"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Bars & Milestone Pins */}
          {points.map((pt, idx) => {
            const isOrigin = originYear !== null && pt.year === originYear;
            const isPeak = peakYear !== null && pt.year === peakYear;
            const isHovered = hoveredYear?.year === pt.year;

            return (
              <g
                key={pt.year}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredYear({ year: pt.year, count: pt.count })
                }
                onMouseLeave={() => setHoveredYear(null)}
                onClick={() => handleYearClick(pt.year)}
              >
                {/* Invisible wider hover target */}
                <rect
                  x={pt.x - Math.max(barWidth, 12) / 2}
                  y={padTop}
                  width={Math.max(barWidth, 12)}
                  height={innerH}
                  fill="transparent"
                />

                {/* Subtle bar */}
                <rect
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={Math.max(pt.barH, pt.count > 0 ? 2 : 0)}
                  rx={2}
                  fill={
                    isHovered
                      ? "rgba(96, 165, 250, 0.7)"
                      : isOrigin
                      ? "rgba(52, 211, 153, 0.45)"
                      : isPeak
                      ? "rgba(251, 191, 36, 0.45)"
                      : "rgba(59, 130, 246, 0.16)"
                  }
                />

                {/* Milestone / Hover Circle */}
                {(isOrigin || isPeak || isHovered) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 4.2}
                    fill={
                      isOrigin
                        ? "#10b981"
                        : isPeak
                        ? "#f59e0b"
                        : "#60a5fa"
                    }
                    stroke="#0b0f19"
                    strokeWidth={1.8}
                  />
                )}

                {isOrigin && (
                  <g transform={`translate(${pt.x}, ${Math.max(14, pt.y - 12)})`}>
                    <text
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={600}
                      fill="#34d399"
                    >
                      Origin
                    </text>
                  </g>
                )}

                {isPeak && !isOrigin && (
                  <g transform={`translate(${pt.x}, ${Math.max(14, pt.y - 12)})`}>
                    <text
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={600}
                      fill="#fbbf24"
                    >
                      Peak
                    </text>
                  </g>
                )}

                {/* X-Axis Year Labels */}
                {(idx % labelStep === 0 ||
                  idx === points.length - 1 ||
                  isOrigin) && (
                  <text
                    x={pt.x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize={10}
                    fill={isHovered ? "#ffffff" : "#64748b"}
                    fontWeight={isHovered ? 600 : 400}
                  >
                    {pt.year}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-blue-400" />
          Data source: OpenAlex annual publication aggregation
        </span>
        <span>Tip: Click any bar to filter papers from that year</span>
      </div>
    </div>
  );
}
